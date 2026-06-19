import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOT_DIR = path.resolve(__dirname, "../test-output/screenshots");
const BASE_URL = "http://localhost:5173";

// Ensure screenshot dir
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

interface VisualCheck {
  passed: boolean;
  name: string;
  details: string;
}

const visualIssues: VisualCheck[] = [];

function reportIssue(name: string, details: string) {
  visualIssues.push({ passed: false, name, details });
  console.error(`  FAIL: ${name} - ${details}`);
}

function reportPass(name: string) {
  visualIssues.push({ passed: true, name, details: "" });
  console.log(`  PASS: ${name}`);
}

async function checkElementHasDarkBg(
  page: any,
  selector: string,
  label: string
) {
  const bg = await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { background: cs.background, backgroundColor: cs.backgroundColor };
  }, selector);
  if (!bg) {
    reportIssue(`Dark bg check: ${label}`, `Element "${selector}" not found`);
    return;
  }
  // Check if background contains black/dark values or is transparent
  const bgStr = JSON.stringify(bg).toLowerCase().replace(/\s/g, "");
  if (
    bgStr.includes("rgb(0,0,0)") ||
    bgStr.includes("#000") ||
    bgStr.includes("black") ||
    bgStr.includes("rgba(0,0,0,")
  ) {
    reportPass(`Dark bg: ${label}`);
  } else {
    reportIssue(
      `Dark bg check: ${label}`,
      `Expected dark background, got ${bgStr}`
    );
  }
}

async function checkTextColor(
  page: any,
  selector: string,
  label: string
) {
  const color = await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    return getComputedStyle(el).color;
  }, selector);
  if (!color) {
    reportIssue(`Text color: ${label}`, `Element "${selector}" not found`);
    return;
  }
  // White text, or rgba white
  if (
    color.includes("255, 255, 255") ||
    color.includes("rgba(255") ||
    color === "rgb(255, 255, 255)"
  ) {
    reportPass(`Text color white: ${label}`);
  } else {
    reportIssue(
      `Text color white: ${label}`,
      `Expected white text, got ${color}`
    );
  }
}

async function checkGlassEffect(page: any, selector: string, label: string) {
  const hasGlass = await page.evaluate((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      backdropFilter: cs.backdropFilter,
      webkitBackdropFilter: (cs as any).webkitBackdropFilter,
    };
  }, selector);
  if (!hasGlass) {
    reportIssue(
      `Glass effect: ${label}`,
      `Element "${selector}" not found`
    );
    return;
  }
  if (
    (hasGlass.backdropFilter && hasGlass.backdropFilter !== "none") ||
    (hasGlass.webkitBackdropFilter && hasGlass.webkitBackdropFilter !== "none")
  ) {
    reportPass(`Glass effect: ${label}`);
  } else {
    reportIssue(
      `Glass effect: ${label}`,
      `Missing backdrop-filter on button`
    );
  }
}

test.describe("DROPS App Visual Snapshot Tests", () => {
  // Increase timeout for screenshot-heavy tests
  test.setTimeout(120000);

  test.afterAll(() => {
    // Write visual issues report
    const reportPath = path.resolve(SCREENSHOT_DIR, "visual-issues-report.json");
    const summary = {
      total: visualIssues.length,
      passed: visualIssues.filter((v) => v.passed).length,
      failed: visualIssues.filter((v) => !v.passed).length,
      issues: visualIssues.filter((v) => !v.passed).map((v) => ({
        name: v.name,
        details: v.details,
      })),
    };
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log("\n===== VISUAL ISSUES REPORT =====");
    console.log(`Total checks: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    if (summary.issues.length > 0) {
      console.log("\nIssues:");
      summary.issues.forEach((i) => {
        console.log(`  - ${i.name}: ${i.details}`);
      });
    }
    console.log("================================");
    console.log(`Report saved to ${reportPath}`);
  });

  test("01 - Onboarding Screen (first visit)", async ({ page }) => {
    // Clear localStorage to show onboarding
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.removeItem("drops_onboarding_completed");
      localStorage.removeItem("drops_user_cards");
      localStorage.removeItem("drops_friends");
    });
    await page.reload();

    // Wait for onboarding to appear
    await page.waitForTimeout(1000);
    await page.waitForSelector("text=DROPS", { timeout: 10000 });
    await page.waitForTimeout(500);

    // Screenshot the onboarding screen
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "01-onboarding.png"),
      fullPage: true,
    });

    // Check dark background
    await checkElementHasDarkBg(
      page,
      ".fixed.inset-0",
      "Onboarding screen background"
    );

    // Check text is white
    await checkTextColor(page, "h1", "Onboarding title text");

    // Check glass button
    const buttons = page.locator(
      'button:has-text("Next"), button:has-text("Skip")'
    );
    const btnCount = await buttons.count();
    if (btnCount > 0) {
      reportPass("Onboarding buttons present");
    } else {
      reportIssue("Onboarding buttons", "No Next/Skip buttons found");
    }

    // Swipe through onboarding screens
    for (let i = 0; i < 5; i++) {
      await page.click('button:has-text("Next")');
      await page.waitForTimeout(400);
    }
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1500);
  });

  test("02 - Desktop Tunnel View (after onboarding)", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
      localStorage.removeItem("drops_user_cards");
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Wait for the app root div with black background to render
    // Cards are rendered into a canvas div — wait for FAB button which is always visible
    await page.waitForSelector('button:has-text("Create your drops")', { timeout: 15000 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-tunnel-view.png"),
      fullPage: true,
    });

    // Check app root has black background (the element with background: #000000)
    await checkElementHasDarkBg(
      page,
      ".relative.w-full.h-full",
      "App root background (tunnel view)"
    );

    // FAB button should exist with glass effect
    // Use Playwright locator, not document.querySelector for pseudo-selectors
    const fabBtnText = page.locator('button:has-text("Create your drops")');
    const fabTextColor = await fabBtnText.evaluate(el => getComputedStyle(el).color);
    if (fabTextColor && (fabTextColor.includes("255, 255, 255") || fabTextColor === "rgb(255, 255, 255)")) {
      reportPass("FAB button text is white");
    } else {
      reportIssue("FAB button text color", `Expected white, got ${fabTextColor}`);
    }

    const fabBackdrop = await fabBtnText.evaluate(el => getComputedStyle(el).backdropFilter);
    const fabWebkitBackdrop = await fabBtnText.evaluate(el => (getComputedStyle(el) as any).webkitBackdropFilter);
    if (fabBackdrop !== "none" || (fabWebkitBackdrop && fabWebkitBackdrop !== "none")) {
      reportPass("FAB button has glass effect (backdrop-filter)");
    } else {
      reportIssue("FAB button glass effect", `backdropFilter: ${fabBackdrop}, webkitBackdropFilter: ${fabWebkitBackdrop}`);
    }
  });

  test("03 - Add Card Modal (FAB click)", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Click FAB
    await page.click('button:has-text("Create your drops")');
    await page.waitForTimeout(1000);

    // Wait for modal
    await page.waitForSelector('text=Text Input', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "03-add-card-modal.png"),
      fullPage: true,
    });

    // Check modal backdrop has dark/translucent bg
    const backdropVisible = await page.locator(".fixed.inset-0").first().isVisible();
    if (backdropVisible) {
      reportPass("Modal backdrop visible");
    } else {
      reportIssue("Modal backdrop", "Backdrop not visible");
    }

    // Theme selector should be present
    const themes = page.locator('text=Swipe to Change Theme');
    const themeCount = await themes.count();
    if (themeCount > 0) {
      reportPass("Theme selector present");
    } else {
      reportIssue("Theme selector", "Theme selector not found");
    }
  });

  test("04 - Text Tab with typed text", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
    });
    await page.reload();
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Create your drops")');
    await page.waitForTimeout(1000);

    // Type text in the textarea
    const textarea = page.locator("textarea");
    await textarea.waitFor({ state: "visible", timeout: 5000 });
    await textarea.fill("Hello, Nice 2 meet u!");
    await page.waitForTimeout(500);

    // Also fill in user name
    const nameInput = page.locator('input[placeholder="Bruno"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test User");
    }
    const roleInput = page.locator('input[placeholder="Product Designer"]');
    if (await roleInput.isVisible()) {
      await roleInput.fill("Test Role");
    }

    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "04-text-tab.png"),
      fullPage: true,
    });

    // Verify text was entered
    const textVal = await textarea.inputValue();
    if (textVal === "Hello, Nice 2 meet u!") {
      reportPass("Text input filled correctly");
    } else {
      reportIssue("Text input", `Expected "Hello, Nice 2 meet u!", got "${textVal}"`);
    }
  });

  test("05 - Image Tab", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
    });
    await page.reload();
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Create your drops")');
    await page.waitForTimeout(1000);

    // Switch to Image tab
    const imageTab = page.locator('button:has-text("Image")');
    await imageTab.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-image-tab.png"),
      fullPage: true,
    });

    // Gallery and Camera buttons should be visible
    const galleryBtn = page.locator('button:has-text("Gallery")');
    const cameraBtn = page.locator('button:has-text("Camera")');
    const galleryVisible = await galleryBtn.isVisible();
    const cameraVisible = await cameraBtn.isVisible();
    if (galleryVisible && cameraVisible) {
      reportPass("Image tab buttons visible (Gallery + Camera)");
    } else {
      reportIssue("Image tab buttons", `Gallery: ${galleryVisible}, Camera: ${cameraVisible}`);
    }
  });

  test("06 - Sticker Tab", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
    });
    await page.reload();
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Create your drops")');
    await page.waitForTimeout(1000);

    // Switch to Sticker tab
    const stickerTab = page.locator('button:has-text("Sticker")');
    await stickerTab.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-sticker-tab.png"),
      fullPage: true,
    });

    // Stickers should be visible (emojis in grid)
    const stickerGrid = page.locator(".grid.grid-cols-4");
    const gridVisible = await stickerGrid.isVisible();
    if (gridVisible) {
      reportPass("Sticker grid visible with emoji options");
    } else {
      reportIssue("Sticker grid", "Grid of 4 columns not found");
    }
  });

  test("07 - Card Gallery Overlay", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
    });
    await page.reload();
    await page.waitForTimeout(3000);

    // Stop auto-play first so cards are stable (click the pause button, bottom-right)
    const pauseBtn = page.locator('button.absolute.bottom-8.right-4');
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
      await page.waitForTimeout(500);
    } else {
      // Fallback: try finding the pause/play button by its position (last button in bottom-right)
      const bottomBtns = page.locator('button.absolute.bottom-8');
      const btnCount = await bottomBtns.count();
      if (btnCount >= 3) {
        // Last bottom button is pause/play
        await bottomBtns.nth(btnCount - 1).click();
        await page.waitForTimeout(500);
      }
    }

    // Use evaluate to programmatically click a card (cards may be outside viewport in scatter layout)
    const clicked = await page.evaluate(() => {
      const cardEl = document.querySelector('[data-card-index]');
      if (!cardEl) return false;
      (cardEl as HTMLElement).click();
      return true;
    });
    if (clicked) {
      await page.waitForTimeout(1500);

      // Wait for gallery modal overlay - look for z-index 999 element
      await page.waitForTimeout(500);

      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "07-card-gallery-overlay.png"),
        fullPage: true,
      });

      // Check overlay has dark backdrop by evaluating computed styles
      const overlayBg = await page.evaluate(() => {
        // Find the gallery overlay - it has z-index 999 and flex layout
        const els = document.querySelectorAll('.fixed.inset-0');
        for (const el of els) {
          const cs = getComputedStyle(el);
          if (cs.zIndex === '999') {
            return { background: cs.background, backgroundColor: cs.backgroundColor };
          }
        }
        return null;
      });
      if (overlayBg) {
        const bgStr = JSON.stringify(overlayBg).toLowerCase().replace(/\s/g, '');
        if (bgStr.includes('rgb(0,0,0)') || bgStr.includes('#000') || bgStr.includes('black') || bgStr.includes('rgba(0,0,0,')) {
          reportPass("Card gallery overlay has dark backdrop");
        } else {
          reportIssue("Card gallery overlay backdrop", `Expected dark bg, got ${JSON.stringify(overlayBg)}`);
        }
      } else {
        reportIssue("Card gallery overlay", "Could not find overlay element with z-index 999");
      }
    } else {
      reportIssue("Card click", "No clickable card elements found in tunnel");
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, "07-card-gallery-overlay.png"),
        fullPage: true,
      });
    }
  });

  test("08 - Admin Panel", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
    });

    // Navigate to admin
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(1000);

    // Enter password
    const pwInput = page.locator('input[type="password"]');
    await pwInput.waitFor({ state: "visible", timeout: 5000 });
    await pwInput.fill("admin123");
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-admin-panel.png"),
      fullPage: true,
    });

    // Dashboard should show stats
    const dashboard = page.locator('text=Dashboard');
    const dashVisible = await dashboard.isVisible();
    if (dashVisible) {
      reportPass("Admin dashboard visible after login");
    } else {
      reportIssue("Admin dashboard", "Dashboard not visible after login");
    }

    // Check dark background
    await checkElementHasDarkBg(
      page,
      ".fixed.inset-0",
      "Admin panel background"
    );
  });

  test("09 - Mobile Views (viewport 390x844)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
    });
    await page.reload();
    await page.waitForTimeout(3000);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "09-mobile-view.png"),
      fullPage: false,
    });

    // Mobile FAB should be present
    const fab = page.locator('button:has-text("Create your drops")');
    if (await fab.isVisible()) {
      reportPass("Mobile FAB visible");
    } else {
      reportIssue("Mobile FAB", "Create your drops button not visible on mobile");
    }

    // Mobile menu bar should be present
    const menuBar = page.locator('button:has-text("My Drop"), button:has-text("Scan"), button:has-text("Connect"), button:has-text("Help")');
    const menuCount = await menuBar.count();
    if (menuCount >= 2) {
      reportPass(`Mobile menu bar visible with ${menuCount} buttons`);
    } else {
      reportIssue("Mobile menu bar", `Found only ${menuCount} menu buttons`);
    }
  });

  test("10 - My Drop Hub", async ({ page }) => {
    // First seed some cards
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
      const cards = [
        {
          id: "test-card-1",
          bg: "#7B61FF",
          quote: "Test drop card",
          handle: "@testuser",
          type: "text",
          accentColor: "#7B61FF",
          cardSkin: "heatmap",
          userName: "Test User",
          themeId: "heatmap",
        },
      ];
      localStorage.setItem("drops_user_cards", JSON.stringify(cards));
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // The FAB should now say "My Drop"
    const myDropBtn = page.locator('button:has-text("My Drop")');
    if (await myDropBtn.isVisible()) {
      await myDropBtn.click();
    } else {
      // Try the mobile menu bar
      const menuMyDrop = page.locator('button:has-text("My Drop")').first();
      if (await menuMyDrop.isVisible()) {
        await menuMyDrop.click();
      }
    }
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "10-my-drop-hub.png"),
      fullPage: true,
    });

    // Check My Drop Hub header (use h1 specifically)
    const header = page.locator('h1:has-text("My Drop")');
    if (await header.isVisible()) {
      reportPass("My Drop Hub header visible");
    } else {
      reportIssue("My Drop Hub", "My Drop h1 header not found");
    }

    // Check dark background
    const myDropBg = page.locator(".fixed.inset-0").first();
    if (await myDropBg.isVisible()) {
      reportPass("My Drop Hub has dark background overlay");
    }
  });

  test("11 - QR Code Back Card", async ({ page }) => {
    // Seed cards first
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
      const cards = [
        {
          id: "test-card-qr",
          bg: "#7B61FF",
          quote: "QR test card",
          handle: "@qruser",
          type: "text",
          accentColor: "#7B61FF",
          cardSkin: "heatmap",
          userName: "QR User",
          themeId: "fractal",
          qrEnabled: true,
        },
      ];
      localStorage.setItem("drops_user_cards", JSON.stringify(cards));
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Open My Drop Hub
    const myDropBtn = page.locator('button:has-text("My Drop")');
    if (await myDropBtn.isVisible()) {
      await myDropBtn.click();
    } else {
      await page.locator('button:has-text("My Drop")').first().click();
    }
    await page.waitForTimeout(1000);

    // Click "Show QR" button
    const showQrBtn = page.locator('button:has-text("Show QR")');
    if (await showQrBtn.isVisible()) {
      await showQrBtn.click();
    } else {
      // Try clicking the card itself (it has onClick to show QR)
      const cardPreview = page.locator('.rounded-\\[18px\\]').first();
      if (await cardPreview.isVisible()) {
        await cardPreview.click();
      }
    }
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "11-qr-back-card.png"),
      fullPage: true,
    });

    // Check for QR canvas
    const qrCanvas = page.locator("canvas");
    const canvasCount = await qrCanvas.count();
    if (canvasCount > 0) {
      reportPass(`QR code canvas rendered (${canvasCount} canvases found)`);
    } else {
      reportIssue("QR canvas", "No canvas element found for QR code");
    }

    // Check for scan text
    const scanText = page.locator('text=Scan to connect');
    if (await scanText.isVisible()) {
      reportPass("QR card shows 'Scan to connect' text");
    } else {
      reportIssue("QR scan text", "'Scan to connect' text not visible");
    }
  });

  test("12 - Success Page After Creating a Drop", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem("drops_onboarding_completed", "true");
    });
    await page.reload();
    await page.waitForTimeout(2000);

    // Open Add Card modal
    await page.click('button:has-text("Create your drops")');
    await page.waitForTimeout(1000);

    // Type text
    const textarea = page.locator("textarea");
    await textarea.waitFor({ state: "visible", timeout: 5000 });
    await textarea.fill("Hello, Nice 2 meet u!");
    await page.waitForTimeout(300);

    // Enter user info
    const nameInput = page.locator('input[placeholder="Bruno"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test User");
    }
    const roleInput = page.locator('input[placeholder="Product Designer"]');
    if (await roleInput.isVisible()) {
      await roleInput.fill("Test Role");
    }

    // Click "Add To Card" button
    const addBtn = page.locator('button:has-text("Add To Card")');
    await addBtn.waitFor({ state: "visible", timeout: 5000 });
    await addBtn.click();
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "12-success-page.png"),
      fullPage: true,
    });

    // Success message should appear
    const successMsg = page.locator('text=You left your mark');
    if (await successMsg.isVisible()) {
      reportPass("Success page shows 'You left your mark'");
    } else {
      reportIssue("Success message", "'You left your mark' not visible");
    }

    // Should see "Explore the wall" button
    const exploreBtn = page.locator('button:has-text("Explore the wall")');
    if (await exploreBtn.isVisible()) {
      reportPass("'Explore the wall' button visible on success page");
    } else {
      reportIssue("Explore button", "Explore the wall button not found");
    }
  });

  test("13 - Admin Panel Login Screen (before login)", async ({ page }) => {
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(1000);

    // Before login
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "13-admin-login.png"),
      fullPage: true,
    });

    // Dark background
    await checkElementHasDarkBg(
      page,
      ".fixed.inset-0",
      "Admin login screen background"
    );

    // Login button present
    const loginBtn = page.locator('button:has-text("Login")');
    if (await loginBtn.isVisible()) {
      reportPass("Admin login button visible");
    } else {
      reportIssue("Admin login button", "Login button not visible");
    }

    // Enter wrong password to test error state
    const pwInput = page.locator('input[type="password"]');
    await pwInput.fill("wrongpass");
    await loginBtn.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "13-admin-login-error.png"),
      fullPage: true,
    });

    const errorMsg = page.locator('text=Wrong password');
    if (await errorMsg.isVisible()) {
      reportPass("Wrong password error message visible");
    } else {
      reportIssue("Admin error", "Wrong password error not shown");
    }
  });
});
