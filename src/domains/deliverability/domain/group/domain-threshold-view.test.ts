import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainThresholdView, toDomainThresholdViews } from "./domain-threshold-view.js";
import { newDomainThreshold } from "./domain-threshold.js";

test("DomainThresholdView shows the status in capitals", () => {
  const item = newDomainThreshold("code-288", "label-361");
  const view = toDomainThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainThresholdViews([item, item]).length, 2, "views");
});
