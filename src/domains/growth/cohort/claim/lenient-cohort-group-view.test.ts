import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientCohortGroupView, toLenientCohortGroupViews } from "./lenient-cohort-group-view.js";
import { newLenientCohortGroup } from "./lenient-cohort-group.js";

test("LenientCohortGroupView shows the status in capitals", () => {
  const item = newLenientCohortGroup("code-997", "label-896");
  const view = toLenientCohortGroupView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientCohortGroupViews([item, item]).length, 2, "views");
});
