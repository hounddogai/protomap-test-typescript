import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRegionalEscalationVarianceView,
  toRegionalEscalationVarianceViews,
} from "./regional-escalation-variance-view.js";
import { newRegionalEscalationVariance } from "./regional-escalation-variance.js";

test("RegionalEscalationVarianceView shows the status in capitals", () => {
  const item = newRegionalEscalationVariance("code-630", "name-998");
  const view = toRegionalEscalationVarianceView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalEscalationVarianceViews([item, item]).length, 2, "views");
});
