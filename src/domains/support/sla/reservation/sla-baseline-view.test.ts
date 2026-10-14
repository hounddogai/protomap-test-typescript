import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaBaselineView, toSlaBaselineViews } from "./sla-baseline-view.js";
import { newSlaBaseline } from "./sla-baseline.js";

test("SlaBaselineView shows the status in capitals", () => {
  const item = newSlaBaseline("code-873", "name-455");
  const view = toSlaBaselineView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaBaselineViews([item, item]).length, 2, "views");
});
