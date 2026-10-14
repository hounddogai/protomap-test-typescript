import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredWindowExceptionView, toTieredWindowExceptionViews } from "./tiered-window-exception-view.js";
import { newTieredWindowException } from "./tiered-window-exception.js";

test("TieredWindowExceptionView shows the status in capitals", () => {
  const item = newTieredWindowException("code-333", "title-955");
  const view = toTieredWindowExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredWindowExceptionViews([item, item]).length, 2, "views");
});
