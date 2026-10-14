import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingComplaintVarianceView,
  toRollingComplaintVarianceViews,
} from "./rolling-complaint-variance-view.js";
import { newRollingComplaintVariance } from "./rolling-complaint-variance.js";

test("RollingComplaintVarianceView shows the status in capitals", () => {
  const item = newRollingComplaintVariance("code-347", "name-372");
  const view = toRollingComplaintVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingComplaintVarianceViews([item, item]).length, 2, "views");
});
