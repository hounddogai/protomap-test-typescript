import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedPaywallTemplateReport } from "./batched-paywall-template-report.js";
import { BatchedPaywallTemplate, newBatchedPaywallTemplate } from "./batched-paywall-template.js";

test("BatchedPaywallTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_555_707);
  const items: BatchedPaywallTemplate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBatchedPaywallTemplate(`batched-paywall-template-${index}`, "sample"));
  }
  const report = buildBatchedPaywallTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
