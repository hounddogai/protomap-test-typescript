import assert from "node:assert/strict";
import { test } from "node:test";
import { toOptOutWindowView, toOptOutWindowViews } from "./opt-out-window-view.js";
import { newOptOutWindow } from "./opt-out-window.js";

test("OptOutWindowView shows the status in capitals", () => {
  const item = newOptOutWindow("code-579", "title-650");
  const view = toOptOutWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toOptOutWindowViews([item, item]).length, 2, "views");
});
