import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalOptOutExceptionView, toGlobalOptOutExceptionViews } from "./global-opt-out-exception-view.js";
import { newGlobalOptOutException } from "./global-opt-out-exception.js";

test("GlobalOptOutExceptionView shows the status in capitals", () => {
  const item = newGlobalOptOutException("code-573", "title-492");
  const view = toGlobalOptOutExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalOptOutExceptionViews([item, item]).length, 2, "views");
});
