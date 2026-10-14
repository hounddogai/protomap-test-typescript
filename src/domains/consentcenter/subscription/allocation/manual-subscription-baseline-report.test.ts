import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualSubscriptionBaselineReport } from "./manual-subscription-baseline-report.js";
import { ManualSubscriptionBaseline, newManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

test("ManualSubscriptionBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_075_034);
  const items: ManualSubscriptionBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualSubscriptionBaseline(`manual-subscription-baseline-${index}`, "sample"));
  }
  const report = buildManualSubscriptionBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
