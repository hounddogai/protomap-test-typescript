import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainEstimateView, toDomainEstimateViews } from "./domain-estimate-view.js";
import { newDomainEstimate } from "./domain-estimate.js";

test("DomainEstimateView shows the status in capitals", () => {
  const item = newDomainEstimate("code-992", "label-515");
  const view = toDomainEstimateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainEstimateViews([item, item]).length, 2, "views");
});
