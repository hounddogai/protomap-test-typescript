import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualActivationWindowView, toManualActivationWindowViews } from "./manual-activation-window-view.js";
import { newManualActivationWindow } from "./manual-activation-window.js";

test("ManualActivationWindowView shows the status in capitals", () => {
  const item = newManualActivationWindow("code-689", "name-677");
  const view = toManualActivationWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualActivationWindowViews([item, item]).length, 2, "views");
});
