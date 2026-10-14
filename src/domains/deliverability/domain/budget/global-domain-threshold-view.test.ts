import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalDomainThresholdView, toGlobalDomainThresholdViews } from "./global-domain-threshold-view.js";
import { newGlobalDomainThreshold } from "./global-domain-threshold.js";

test("GlobalDomainThresholdView shows the status in capitals", () => {
  const item = newGlobalDomainThreshold("code-789", "name-441");
  const view = toGlobalDomainThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalDomainThresholdViews([item, item]).length, 2, "views");
});
