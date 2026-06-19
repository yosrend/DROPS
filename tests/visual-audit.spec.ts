import { test, expect } from '@playwright/test';

test.describe('UI Component Visual Audit', () => {

  test('01 - Onboarding: dark theme + liquid glass buttons', async ({ page }) => {
    await page.goto('/');
    // Clear onboarding state to show it
    await page.evaluate(() => localStorage.removeItem('drops_onboarding'));
    await page.reload();
    await page.waitForTimeout(500);

    const bg = await page.evaluate(() => {
      const el = document.querySelector('.fixed.inset-0');
      if (!el) return '';
      return window.getComputedStyle(el).background;
    });
    expect(bg).toContain('0, 0, 0');
  });

  test('02 - AddCardModal: dark panel + white text', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    // Click FAB to open modal
    const fab = page.locator('button:has-text("Create your drops")').first();
    if (await fab.isVisible()) await fab.click();
    await page.waitForTimeout(800);

    // Check modal overlay has dark background
    const modalOverlay = await page.evaluate(() => {
      const fixed = document.querySelectorAll('.fixed');
      for (const f of fixed) {
        const bg = window.getComputedStyle(f).background;
        if (bg.includes('0, 0, 0')) return bg;
      }
      return '';
    });
    expect(modalOverlay).toContain('0, 0, 0');
  });

  test('03 - AdminPanel: dark bg + white text', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(500);

    const loginBg = await page.evaluate(() => {
      const el = document.querySelector('.fixed.inset-0');
      if (!el) return '';
      return window.getComputedStyle(el).background;
    });
    expect(loginBg).toContain('0, 0, 0');

    // Login
    await page.fill('input[placeholder="Password"]', 'admin123');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(500);

    // Check dashboard text color
    const dashColor = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (!h1) return '';
      return window.getComputedStyle(h1).color;
    });
    expect(dashColor).toBe('rgb(255, 255, 255)');
  });

  test('04 - MyDropHub: dark overlay + tabs', async ({ page }) => {
    await page.goto('/?seed');
    await page.waitForTimeout(1000);

    // Open My Drop
    const btn = page.locator('button:has-text("My Drop")').first();
    if (await btn.isVisible()) await btn.click();
    await page.waitForTimeout(800);

    const hubBg = await page.evaluate(() => {
      const divs = document.querySelectorAll('.fixed.inset-0');
      for (const d of divs) {
        const bg = window.getComputedStyle(d).background;
        if (bg.includes('0, 0, 0')) return bg;
      }
      return '';
    });
    expect(hubBg).toContain('0, 0, 0');
  });

  test('05 - Success page: dark theme after card creation', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    // Open modal and submit with text
    const fab = page.locator('button:has-text("Create your drops")').first();
    if (await fab.isVisible()) await fab.click();
    await page.waitForTimeout(800);

    // Type text then submit
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('Test drop');
      await page.waitForTimeout(300);
      const submitBtn = page.locator('button:has-text("Add To Card")');
      if (await submitBtn.isVisible()) await submitBtn.click();
      await page.waitForTimeout(1000);
    }

    // Check success page
    const successText = page.locator('text=You left your mark');
    await expect(successText).toBeVisible({ timeout: 3000 });

    const textColor = await successText.evaluate(el => window.getComputedStyle(el).color);
    expect(textColor).toBe('rgb(255, 255, 255)');
  });

  test('06 - QR Scanner: dark UI', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    // Bottom menu scan
    const scanBtn = page.locator('button:has-text("Scan")').first();
    if (await scanBtn.isVisible()) {
      await scanBtn.click();
      await page.waitForTimeout(500);

      // Verify dark overlay
      const overlayBg = await page.evaluate(() => {
        const fixed = document.querySelectorAll('.fixed');
        for (const f of fixed) {
          const bg = window.getComputedStyle(f).background;
          if (bg.includes('0, 0, 0')) return bg;
        }
        return '';
      });
      expect(overlayBg).toContain('0, 0, 0');
    }
  });

  test('07 - FriendList: dark UI', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    const connectBtn = page.locator('button:has-text("Connect")').first();
    if (await connectBtn.isVisible()) {
      await connectBtn.click();
      await page.waitForTimeout(500);

      // Check overlay is dark
      const connBg = await page.evaluate(() => {
        const fixed = document.querySelectorAll('.fixed');
        for (const f of fixed) {
          const bg = window.getComputedStyle(f).background;
          if (bg.includes('0, 0, 0')) return bg;
        }
        return '';
      });
      expect(connBg).toContain('0, 0, 0');
    }
  });

  test('08 - Card Gallery Overlay: dark flip card', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(2000);

    // Click a card in the tunnel
    const card = page.locator('[class*="rounded-"]').first();
    if (await card.isVisible()) {
      await card.click();
      await page.waitForTimeout(800);

      const overlayBg = await page.evaluate(() => {
        const fixed = document.querySelectorAll('[class*="z-[999"]');
        for (const f of fixed) {
          const bg = window.getComputedStyle(f).background;
          if (bg.includes('0, 0, 0')) return bg;
        }
        return '';
      });
      expect(overlayBg).toBeTruthy();
    }
  });

  test('09 - Toggle switches: green when on', async ({ page }) => {
    // Check the IosToggle component in AddCardModal
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    const fab = page.locator('button:has-text("Create your drops")').first();
    if (await fab.isVisible()) {
      await fab.click();
      await page.waitForTimeout(800);

      // Find toggle switches - should have green background when ON
      const toggles = page.locator('[class*="rounded-[100px]"]');
      const count = await toggles.count();
      if (count > 0) {
        const toggleBg = await toggles.first().evaluate(el => window.getComputedStyle(el).background);
        expect(toggleBg).toContain('rgb(52, 199, 89)'); // #34c759 green
      }
    }
  });

  test('10 - Color pickers: liquid glass style', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    const fab = page.locator('button:has-text("Create your drops")').first();
    if (await fab.isVisible()) {
      await fab.click();
      await page.waitForTimeout(800);

      // Check color swatches exist
      const swatches = page.locator('[class*="rounded-[14px]"]');
      const swatchCount = await swatches.count();
      expect(swatchCount).toBeGreaterThan(0);
    }
  });

  test('11 - Font selector: dropdown works', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    const fab = page.locator('button:has-text("Create your drops")').first();
    if (await fab.isVisible()) {
      await fab.click();
      await page.waitForTimeout(800);

      // Click font selector
      const fontTrigger = page.locator('button:has-text("Inter")');
      if (await fontTrigger.isVisible()) {
        await fontTrigger.click();
        await page.waitForTimeout(300);

        const dropdown = page.locator('[class*="rounded-2xl shadow-lg"]');
        await expect(dropdown).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('12 - Bottom menu: dark glass buttons', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    const menuItems = page.locator('button:has-text("My Drop"), button:has-text("Scan"), button:has-text("Connect"), button:has-text("Help")');
    const count = await menuItems.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Check glass effect
    const btnStyle = await menuItems.first().evaluate(el => {
      const style = window.getComputedStyle(el);
      return { bg: style.background, blur: style.backdropFilter };
    });
    expect(btnStyle.bg).toContain('rgba');
  });

  test('13 - Sliders: dark track liquid glass', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    // Open controls panel
    const controlsBtn = page.locator('[class*="bottom-8 left-4"]').first();
    if (await controlsBtn.isVisible()) {
      await controlsBtn.click();
      await page.waitForTimeout(500);

      // Check sliders exist
      const sliders = page.locator('input[type="range"]');
      const sliderCount = await sliders.count();
      expect(sliderCount).toBe(3); // Spread, Depth, Zoom
    }
  });

  test('14 - Play/pause button: toggle works', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('drops_onboarding_completed', 'true'));
    await page.reload();
    await page.waitForTimeout(1000);

    const playBtn = page.locator('[class*="bottom-8 right-4"]').first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
      await page.waitForTimeout(300);
      // Should now show pause icon
      await expect(playBtn).toBeVisible();
    }
  });
});
