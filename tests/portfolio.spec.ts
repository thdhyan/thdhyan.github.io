import { test, expect } from '@playwright/test';

test('Portfolio loads sections and typography correctly', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Verify Hero section
  await expect(page.getByRole('heading', { name: 'Dhyan Thakkar' })).toBeVisible();
  await expect(page.getByText('Robotics Engineer · MS Robotics @ UMN')).toBeVisible();

  // Verify About section
  await expect(page.getByText('6+', { exact: true })).toBeVisible();

  // Verify Projects
  await expect(page.getByRole('heading', { name: 'Human-to-Robot Motion Retargeting', exact: true })).toBeVisible();
  await expect(page.getByText('Quadrupedal System Identification')).toBeVisible();

  // Verify Skills
  await expect(page.getByText('Skills & Tools')).toBeVisible();
  await expect(page.getByText('Reinforcement Learning')).toBeVisible();

  // Verify Contact
  await expect(page.getByText("Let's build something that moves.")).toBeVisible();
});
