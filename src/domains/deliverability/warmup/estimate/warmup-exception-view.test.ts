import assert from "node:assert/strict";
import { test } from "node:test";
import { toWarmupExceptionView, toWarmupExceptionViews } from "./warmup-exception-view.js";
import { newWarmupException } from "./warmup-exception.js";

test("WarmupExceptionView shows the status in capitals", () => {
  const item = newWarmupException("code-153", "name-525");
  const view = toWarmupExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWarmupExceptionViews([item, item]).length, 2, "views");
});
