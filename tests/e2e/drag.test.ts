import { test, expect } from '@playwright/test';

test('Dragging an overlay updates its position', async ({ page }) => {
  await page.goto('/');
  await page.locator('#pdf-file-input').setInputFiles('tests/fixtures/test-document.pdf');
  await expect(page.locator('.pdf-canvas')).toBeVisible();
  
  await page.getByRole('button', { name: 'Add Text' }).click();
  const textOverlay = page.locator('.pdf-overlay.text-overlay');
  await expect(textOverlay).toBeVisible();
  
  const boxBefore = await textOverlay.boundingBox();
  expect(boxBefore).not.toBeNull();

  // Drag it
  await textOverlay.hover();
  await page.mouse.down();
  await page.mouse.move(boxBefore!.x + 100, boxBefore!.y + 100, { steps: 5 });
  await page.mouse.up();

  const boxAfter = await textOverlay.boundingBox();
  expect(boxAfter).not.toBeNull();
  
  // It should have moved
  expect(boxAfter!.x).toBeGreaterThan(boxBefore!.x + 50);
  expect(boxAfter!.y).toBeGreaterThan(boxBefore!.y + 50);
});
