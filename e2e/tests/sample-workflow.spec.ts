import { test, expect } from '@playwright/test';

test('register a sample and complete its analysis end to end', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'LabTrack' })).toBeVisible();

  const code = `E2E-${Date.now().toString().slice(-6)}`;
  await page.getByLabel('Sample code').fill(code);
  await page.getByLabel('Study ID').fill('TOX-12');
  await page.getByLabel('Type').selectOption('Serum');
  await page.getByRole('button', { name: 'Register' }).click();

  const row = page.getByRole('row', { name: new RegExp(code) });
  await expect(row).toContainText('Received');

  await page.getByRole('button', { name: `Move ${code} to In analysis` }).click();
  await expect(row).toContainText('In analysis');

  await page.getByRole('button', { name: `Move ${code} to Completed` }).click();
  await expect(row).toContainText('Completed');
});

test('shows a validation error for a bad sample code', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Sample code').fill('bad code!');
  await page.getByLabel('Study ID').fill('TOX-12');
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('alert')).toContainText('code must be');
});
