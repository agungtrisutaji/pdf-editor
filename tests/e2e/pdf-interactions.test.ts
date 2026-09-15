import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('PDF Editor Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Uploading a PDF enables tools and displays the canvas', async ({ page }) => {
    const fileInput = page.locator('#pdf-file-input');
    
    // Upload PDF
    await fileInput.setInputFiles('tests/fixtures/test-document.pdf');

    // Wait for PDF to load and status to become 'Ready'
    await expect(page.locator('.pdf-canvas')).toBeVisible();
    
    // Zoom controls should be enabled
    const zoomInBtn = page.getByRole('button', { name: 'Zoom in' });
    await expect(zoomInBtn).toBeEnabled();

    // Add Text button should be enabled
    const addTextBtn = page.getByRole('button', { name: 'Add Text' });
    await expect(addTextBtn).toBeEnabled();
  });

  test('Adding a text overlay creates an element on the canvas', async ({ page }) => {
    // 1. Upload PDF
    const fileInput = page.locator('#pdf-file-input');
    await fileInput.setInputFiles('tests/fixtures/test-document.pdf');
    await expect(page.locator('.pdf-canvas')).toBeVisible();

    // 2. Click Add Text
    const addTextBtn = page.getByRole('button', { name: 'Add Text' });
    await addTextBtn.click();

    // 3. Verify overlay appears and is selected
    const textOverlay = page.locator('.pdf-overlay.text-overlay');
    await expect(textOverlay).toBeVisible();
    await expect(textOverlay).toHaveClass(/is-selected/);
    
    const textContent = textOverlay.locator('.text-overlay-content');
    await expect(textContent).toContainText('Text');
  });

  test('Export PDF button becomes enabled after uploading', async ({ page }) => {
    const fileInput = page.locator('#pdf-file-input');
    
    // Should be disabled initially
    const exportBtn = page.getByRole('button', { name: 'Export PDF' });
    await expect(exportBtn).toBeDisabled();

    // Upload PDF
    await fileInput.setInputFiles('tests/fixtures/test-document.pdf');
    await expect(page.locator('.pdf-canvas')).toBeVisible();
    
    // Export should now be enabled
    await expect(exportBtn).toBeEnabled();
  });
});
