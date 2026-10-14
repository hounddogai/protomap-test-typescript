import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalCreativeExceptionView, toGlobalCreativeExceptionViews } from "./global-creative-exception-view.js";
import { newGlobalCreativeException } from "./global-creative-exception.js";

test("GlobalCreativeExceptionView shows the status in capitals", () => {
  const item = newGlobalCreativeException("code-662", "label-218");
  const view = toGlobalCreativeExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalCreativeExceptionViews([item, item]).length, 2, "views");
});
