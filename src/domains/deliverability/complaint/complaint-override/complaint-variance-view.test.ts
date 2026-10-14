import assert from "node:assert/strict";
import { test } from "node:test";
import { toComplaintVarianceView, toComplaintVarianceViews } from "./complaint-variance-view.js";
import { newComplaintVariance } from "./complaint-variance.js";

test("ComplaintVarianceView shows the status in capitals", () => {
  const item = newComplaintVariance("code-766", "name-881");
  const view = toComplaintVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toComplaintVarianceViews([item, item]).length, 2, "views");
});
