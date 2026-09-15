import { test, expect } from '@playwright/test';

test('App should load and display empty state', async ({ page }) => {
  await page.goto('/');
  
  // Verify main title or branding in the sidebar
  await expect(page.locator('.sidebar h1')).toHaveText('PDF Overlay Editor');

  // Verify empty state message
  const emptyState = page.locator('.empty-state');
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toContainText('Choose a local PDF file to preview its pages.');

  // Verify zoom controls are present but disabled
  const zoomInBtn = page.getByRole('button', { name: 'Zoom in' });
  const zoomOutBtn = page.getByRole('button', { name: 'Zoom out' });
  
  await expect(zoomInBtn).toBeVisible();
  await expect(zoomInBtn).toBeDisabled();
  
  await expect(zoomOutBtn).toBeVisible();
  await expect(zoomOutBtn).toBeDisabled();
});
