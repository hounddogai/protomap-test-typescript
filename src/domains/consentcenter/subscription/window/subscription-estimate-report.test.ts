import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionEstimateReport } from "./subscription-estimate-report.js";
import { SubscriptionEstimate, newSubscriptionEstimate } from "./subscription-estimate.js";

test("SubscriptionEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_082_082);
  const items: SubscriptionEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSubscriptionEstimate(`subscription-estimate-${index}`, "sample"));
  }
  const report = buildSubscriptionEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
