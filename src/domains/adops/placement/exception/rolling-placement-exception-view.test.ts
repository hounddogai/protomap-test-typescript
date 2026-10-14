import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingPlacementExceptionView,
  toRollingPlacementExceptionViews,
} from "./rolling-placement-exception-view.js";
import { newRollingPlacementException } from "./rolling-placement-exception.js";

test("RollingPlacementExceptionView shows the status in capitals", () => {
  const item = newRollingPlacementException("code-317", "name-447");
  const view = toRollingPlacementExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPlacementExceptionViews([item, item]).length, 2, "views");
});
