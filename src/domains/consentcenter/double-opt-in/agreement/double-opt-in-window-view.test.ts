import assert from "node:assert/strict";
import { test } from "node:test";
import { toDoubleOptInWindowView, toDoubleOptInWindowViews } from "./double-opt-in-window-view.js";
import { newDoubleOptInWindow } from "./double-opt-in-window.js";

test("DoubleOptInWindowView shows the status in capitals", () => {
  const item = newDoubleOptInWindow("code-593", "title-141");
  const view = toDoubleOptInWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDoubleOptInWindowViews([item, item]).length, 2, "views");
});
