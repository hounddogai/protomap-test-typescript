import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultDomainThresholdView, toDefaultDomainThresholdViews } from "./default-domain-threshold-view.js";
import { newDefaultDomainThreshold } from "./default-domain-threshold.js";

test("DefaultDomainThresholdView shows the status in capitals", () => {
  const item = newDefaultDomainThreshold("code-368", "title-56");
  const view = toDefaultDomainThresholdView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultDomainThresholdViews([item, item]).length, 2, "views");
});
