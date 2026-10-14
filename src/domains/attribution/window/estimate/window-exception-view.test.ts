import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowExceptionView, toWindowExceptionViews } from "./window-exception-view.js";
import { newWindowException } from "./window-exception.js";

test("WindowExceptionView shows the status in capitals", () => {
  const item = newWindowException("code-938", "name-561");
  const view = toWindowExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowExceptionViews([item, item]).length, 2, "views");
});
