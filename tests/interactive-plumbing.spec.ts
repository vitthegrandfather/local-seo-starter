import { expect, test, type Locator, type Page } from '@playwright/test';

function plumbingControls(page: Page) {
  const container = page.getByTestId('interactive-plumbing');
  return {
    container,
    scene: container.getByTestId('plumbing-scene'),
    control: container.getByRole('slider', { name: 'Otwarcie zaworu', exact: true }),
    status: container.getByRole('status'),
  };
}

async function openingValue(control: Locator) {
  return Number(await control.getAttribute('aria-valuenow'));
}

async function expectOpening(page: Page, percentage: number) {
  const { control, status } = plumbingControls(page);
  await expect(control).toHaveAttribute('aria-valuenow', String(percentage));
  await expect(control).toHaveAttribute('aria-valuetext', `${percentage}%`);
  const message =
    percentage === 0
      ? 'Zawór zamknięty'
      : percentage === 100
        ? 'Woda płynie'
        : `Otwarcie zaworu: ${percentage}%`;
  await expect(status).toHaveText(message);
}

async function reachControlWithTab(page: Page) {
  const { control } = plumbingControls(page);
  for (let presses = 0; presses < 30; presses += 1) {
    await page.keyboard.press('Tab');
    if (await control.evaluate((element) => element === document.activeElement)) break;
  }
  await expect(control).toBeFocused();
}

async function waitForCanvasPaint(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

async function captureCanvas(page: Page, canvas: Locator) {
  await canvas.scrollIntoViewIfNeeded();
  const bounds = await canvas.boundingBox();
  expect(bounds).not.toBeNull();
  // Keep fractional element edges from including a neighboring caption pixel.
  const x = Math.ceil(bounds!.x);
  const y = Math.ceil(bounds!.y);
  return page.screenshot({
    clip: {
      x,
      y,
      width: Math.floor(bounds!.x + bounds!.width) - x,
      height: Math.floor(bounds!.y + bounds!.height) - y,
    },
  });
}

async function expectCanvasUnchanged(page: Page, canvas: Locator, expected: Buffer, label: string) {
  await waitForCanvasPaint(page);
  const actual = await captureCanvas(page, canvas);
  if (!actual.equals(expected)) {
    await test.info().attach(`${label}-before`, { body: expected, contentType: 'image/png' });
    await test.info().attach(`${label}-after`, { body: actual, contentType: 'image/png' });
  }
  expect(actual.equals(expected), label).toBe(true);
}

async function beginDrag(page: Page) {
  const { scene } = plumbingControls(page);
  await scene.scrollIntoViewIfNeeded();
  const bounds = await scene.boundingBox();
  expect(bounds).not.toBeNull();
  const point = {
    x: bounds!.x + bounds!.width * 0.45,
    y: bounds!.y + bounds!.height * 0.2,
    width: bounds!.width,
  };
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  return point;
}

async function dragTo(
  page: Page,
  point: { x: number; y: number; width: number },
  distance: number,
) {
  await page.mouse.move(point.x + point.width * distance, point.y, { steps: 8 });
  await waitForCanvasPaint(page);
}

test('the valve starts closed and repeated clicks do not change it', async ({ page }) => {
  await page.goto('/');
  const { container, control } = plumbingControls(page);
  await expectOpening(page, 0);
  await expect(container.getByRole('button')).toHaveCount(0);
  await expect(container.locator('input')).toHaveCount(0);
  await expect(container.getByRole('slider')).toHaveCount(1);
  await expect(container.locator('figcaption')).toHaveText(
    'Przeciągnij uchwyt w prawo lub w lewo.',
  );
  await control.hover();
  await expectOpening(page, 0);
  for (let clicks = 0; clicks < 4; clicks += 1) await control.click();
  await expectOpening(page, 0);
});

test('the scene is reachable with Tab and supports arrows, Home and End without click keys', async ({
  page,
}) => {
  await page.goto('/');
  const { control } = plumbingControls(page);
  await reachControlWithTab(page);
  await expect(control).toHaveAttribute('aria-valuemin', '0');
  await expect(control).toHaveAttribute('aria-valuemax', '100');
  await page.keyboard.press('ArrowRight');
  await expectOpening(page, 5);
  for (let step = 0; step < 9; step += 1) await page.keyboard.press('ArrowUp');
  await expectOpening(page, 50);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expectOpening(page, 50);
  await control.scrollIntoViewIfNeeded();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowDown');
  await expectOpening(page, 40);
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowRight');
  await expectOpening(page, 100);
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowLeft');
  await expectOpening(page, 0);
  await expect(control).toBeFocused();
});

test('dragging holds a partial opening on release and clicking cannot toggle it', async ({
  page,
}) => {
  await page.goto('/');
  const { control, status } = plumbingControls(page);
  const point = await beginDrag(page);
  await dragTo(page, point, 0.15);
  const partial = await openingValue(control);
  expect(partial).toBeGreaterThan(25);
  expect(partial).toBeLessThan(75);
  await expect(status).toHaveText('Zawór zamknięty');
  await page.mouse.up();
  await expectOpening(page, partial);
  await control.click();
  await expectOpening(page, partial);
  const closingPoint = await beginDrag(page);
  await dragTo(page, closingPoint, -0.3);
  await page.mouse.up();
  await expectOpening(page, 0);
});

test('reversing direction during one drag reduces the selected opening', async ({ page }) => {
  await page.goto('/');
  const { control } = plumbingControls(page);
  const point = await beginDrag(page);
  await dragTo(page, point, 0.18);
  const higher = await openingValue(control);
  expect(higher).toBeGreaterThan(40);
  await dragTo(page, point, 0.09);
  const lower = await openingValue(control);
  expect(lower).toBeGreaterThan(0);
  expect(lower).toBeLessThan(higher);
  await page.mouse.up();
  await expectOpening(page, lower);
});

test('releasing outside the scene ends the drag and retains its opening', async ({ page }) => {
  await page.goto('/');
  const { control } = plumbingControls(page);
  const point = await beginDrag(page);
  await dragTo(page, point, 0.12);
  const partial = await openingValue(control);
  expect(partial).toBeGreaterThan(20);
  await page.mouse.move(point.x + point.width * 0.12, 0);
  await page.mouse.up();
  await expectOpening(page, partial);
  await page.mouse.move(point.x - point.width * 0.12, point.y);
  await expectOpening(page, partial);
  await control.press('Home');
  await expectOpening(page, 0);
});

test('pointer cancellation retains the value and cannot leave an active drag behind', async ({
  page,
}) => {
  await page.goto('/');
  const { control } = plumbingControls(page);
  await control.evaluate((element) => {
    element.addEventListener(
      'pointerdown',
      (event) =>
        element.setAttribute('data-test-pointer-id', String((event as PointerEvent).pointerId)),
      { once: true },
    );
  });
  const point = await beginDrag(page);
  const pointerId = Number(await control.getAttribute('data-test-pointer-id'));
  expect(pointerId).toBeGreaterThan(0);
  await dragTo(page, point, 0.12);
  const partial = await openingValue(control);
  expect(partial).toBeGreaterThan(20);
  await control.dispatchEvent('pointercancel', {
    pointerId,
    pointerType: 'mouse',
    isPrimary: true,
  });
  await page.mouse.move(point.x + point.width * 0.2, point.y);
  await page.mouse.up();
  await expectOpening(page, partial);
  await control.press('Home');
  await expectOpening(page, 0);
});

test('small pointer jitter does not open the valve', async ({ page }) => {
  await page.goto('/');
  const point = await beginDrag(page);
  await page.mouse.move(point.x + 3, point.y);
  await page.mouse.up();
  await expectOpening(page, 0);
});

test('the 3D renderer loads on interaction and keeps the faucet fixed across pointer movement', async ({
  page,
}) => {
  await page.goto('/');
  const { container, scene, control } = plumbingControls(page);
  await scene.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await expect(container).toHaveAttribute('data-renderer', 'poster');
  const canvas = container.locator('canvas');
  await expect(canvas).toHaveCSS('opacity', '0');
  const bounds = await control.boundingBox();
  expect(bounds).not.toBeNull();
  await page.mouse.move(bounds!.x + bounds!.width * 0.2, bounds!.y + bounds!.height * 0.25);
  await expect(container).toHaveAttribute('data-renderer', 'webgl');
  await expect(canvas).toHaveCSS('opacity', '1');
  await expect(scene).toHaveCSS('transform', 'none');
  await waitForCanvasPaint(page);
  const fixedView = await captureCanvas(page, canvas);
  await page.mouse.move(bounds!.x + bounds!.width * 0.8, bounds!.y + bounds!.height * 0.25);
  await expectCanvasUnchanged(page, canvas, fixedView, 'pointer movement keeps the faucet fixed');
  await page.mouse.move(0, 0);
  await expectCanvasUnchanged(page, canvas, fixedView, 'pointer leaving keeps the faucet fixed');
  await expectOpening(page, 0);
});

test('unavailable WebGL keeps a visible fallback that responds to direct dragging', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      ...args: unknown[]
    ) {
      if (['webgl2', 'webgl', 'experimental-webgl'].includes(contextId)) return null;
      return Reflect.apply(getContext, this, [contextId, ...args]);
    } as typeof getContext;
  });
  await page.goto('/');
  const { container, scene, control } = plumbingControls(page);
  await control.hover();
  await expect(container).toHaveAttribute('data-renderer', 'fallback');
  await expect(container.locator('canvas')).toHaveCSS('opacity', '0');
  const closedView = await scene.screenshot();
  const point = await beginDrag(page);
  await dragTo(page, point, 0.15);
  await page.mouse.up();
  const partial = await openingValue(control);
  expect(partial).toBeGreaterThan(25);
  expect(partial).toBeLessThan(75);
  await expectOpening(page, partial);
  await expect.poll(async () => Buffer.compare(await scene.screenshot(), closedView)).not.toBe(0);
  const closingPoint = await beginDrag(page);
  await dragTo(page, closingPoint, -0.3);
  await page.mouse.up();
  await expectOpening(page, 0);
  await expect(container).toHaveAttribute('data-renderer', 'fallback');
  expect(runtimeErrors).toEqual([]);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('water stays still while the scene remains keyboard adjustable', async ({ page }) => {
    await page.goto('/');
    const { container, scene, control } = plumbingControls(page);
    await reachControlWithTab(page);
    await expect(container).toHaveAttribute('data-renderer', 'webgl');
    const canvas = container.locator('canvas');
    await expect(canvas).toHaveCSS('opacity', '1');
    await waitForCanvasPaint(page);
    const closedView = await captureCanvas(page, canvas);
    await page.keyboard.press('End');
    await expectOpening(page, 100);
    await waitForCanvasPaint(page);
    const openView = await captureCanvas(page, canvas);
    expect(openView.equals(closedView), 'opening updates the static reduced-motion view').toBe(
      false,
    );
    await expectCanvasUnchanged(page, canvas, openView, 'reduced-motion water stays still');
    const bounds = await control.boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.move(bounds!.x + bounds!.width * 0.8, bounds!.y + bounds!.height * 0.25);
    await expectCanvasUnchanged(page, canvas, openView, 'reduced-motion view stays still on hover');
    await expect(scene).toHaveCSS('transform', 'none');
    await expect
      .poll(() =>
        container.evaluate(
          (element) =>
            element
              .getAnimations({ subtree: true })
              .filter((animation) => animation.playState === 'running' || animation.pending).length,
        ),
      )
      .toBe(0);
    await page.keyboard.press('Home');
    await expectOpening(page, 0);
  });
});

test('steady flowing water stays within its renderer draw-call budget', async ({ page }) => {
  await page.addInitScript(() => {
    const stats = { frameDraws: [] as number[], current: 0, timestamp: -1 };
    const instrumentedWindow = window as typeof window & { plumbingDrawBudget: typeof stats };
    instrumentedWindow.plumbingDrawBudget = stats;

    const prototype = WebGL2RenderingContext.prototype;
    const drawElements = prototype.drawElements;
    const drawArrays = prototype.drawArrays;
    const drawElementsInstanced = prototype.drawElementsInstanced;
    const drawArraysInstanced = prototype.drawArraysInstanced;
    prototype.drawElements = function (mode, count, type, offset) {
      stats.current += 1;
      drawElements.call(this, mode, count, type, offset);
    };
    prototype.drawArrays = function (mode, first, count) {
      stats.current += 1;
      drawArrays.call(this, mode, first, count);
    };
    prototype.drawElementsInstanced = function (mode, count, type, offset, instances) {
      stats.current += 1;
      drawElementsInstanced.call(this, mode, count, type, offset, instances);
    };
    prototype.drawArraysInstanced = function (mode, first, count, instances) {
      stats.current += 1;
      drawArraysInstanced.call(this, mode, first, count, instances);
    };

    const requestFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      requestFrame((timestamp) => {
        // Every callback for one browser frame shares the same timestamp.
        if (stats.timestamp !== timestamp) {
          if (stats.timestamp >= 0) stats.frameDraws.push(stats.current);
          stats.current = 0;
          stats.timestamp = timestamp;
        }
        callback(timestamp);
      });
  });

  await page.goto('/');
  const { container, control } = plumbingControls(page);
  await control.focus();
  await page.keyboard.press('End');
  await expect(container).toHaveAttribute('data-renderer', 'webgl');
  await expectOpening(page, 100);
  // Exclude shader compilation and the initial handle-opening transition.
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const stats = (
      window as typeof window & {
        plumbingDrawBudget: { frameDraws: number[]; current: number; timestamp: number };
      }
    ).plumbingDrawBudget;
    stats.frameDraws = [];
    stats.current = 0;
    stats.timestamp = -1;
  });
  const renderedFrameCounts = () =>
    page.evaluate(() => {
      const stats = (window as typeof window & { plumbingDrawBudget: { frameDraws: number[] } })
        .plumbingDrawBudget;
      return stats.frameDraws.filter((count) => count > 0);
    });
  await expect.poll(async () => (await renderedFrameCounts()).length).toBeGreaterThanOrEqual(3);
  const counts = (await renderedFrameCounts()).slice(0, 3);
  expect(
    Math.max(...counts),
    `WebGL draw calls per rendered frame: ${counts.join(', ')}`,
  ).toBeLessThanOrEqual(20);
});

test.describe('mobile touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test('taps do nothing and direct touch dragging adjusts the valve without overflow', async ({
    page,
  }) => {
    await page.goto('/');
    const { scene, control } = plumbingControls(page);
    await scene.scrollIntoViewIfNeeded();
    await control.tap();
    await control.tap();
    await expectOpening(page, 0);
    const expectNoOverflow = async () => {
      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
    };
    await expectNoOverflow();
    const bounds = await scene.boundingBox();
    expect(bounds).not.toBeNull();
    const x = bounds!.x + bounds!.width * 0.45;
    const y = bounds!.y + bounds!.height * 0.2;
    const touch = await page.context().newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x + bounds!.width * 0.15, y }],
    });
    await waitForCanvasPaint(page);
    const partial = await openingValue(control);
    expect(partial).toBeGreaterThan(20);
    expect(partial).toBeLessThan(80);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expectOpening(page, partial);
    await control.tap();
    await expectOpening(page, partial);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x - bounds!.width * 0.3, y }],
    });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expectOpening(page, 0);
    await expectNoOverflow();
    await touch.detach();
  });
});
