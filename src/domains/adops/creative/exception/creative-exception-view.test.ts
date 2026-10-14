import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeExceptionView, toCreativeExceptionViews } from "./creative-exception-view.js";
import { newCreativeException } from "./creative-exception.js";

test("CreativeExceptionView shows the status in capitals", () => {
  const item = newCreativeException("code-919", "name-886");
  const view = toCreativeExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeExceptionViews([item, item]).length, 2, "views");
});
