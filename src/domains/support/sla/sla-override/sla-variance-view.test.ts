import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaVarianceView, toSlaVarianceViews } from "./sla-variance-view.js";
import { newSlaVariance } from "./sla-variance.js";

test("SlaVarianceView shows the status in capitals", () => {
  const item = newSlaVariance("code-757", "title-652");
  const view = toSlaVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaVarianceViews([item, item]).length, 2, "views");
});
