import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultWarmupExceptionView, toDefaultWarmupExceptionViews } from "./default-warmup-exception-view.js";
import { newDefaultWarmupException } from "./default-warmup-exception.js";

test("DefaultWarmupExceptionView shows the status in capitals", () => {
  const item = newDefaultWarmupException("code-459", "name-89");
  const view = toDefaultWarmupExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultWarmupExceptionViews([item, item]).length, 2, "views");
});
