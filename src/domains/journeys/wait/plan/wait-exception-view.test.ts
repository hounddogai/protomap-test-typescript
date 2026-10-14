import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitExceptionView, toWaitExceptionViews } from "./wait-exception-view.js";
import { newWaitException } from "./wait-exception.js";

test("WaitExceptionView shows the status in capitals", () => {
  const item = newWaitException("code-661", "title-284");
  const view = toWaitExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitExceptionViews([item, item]).length, 2, "views");
});
