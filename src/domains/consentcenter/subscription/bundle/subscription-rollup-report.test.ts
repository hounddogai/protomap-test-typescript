import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionRollupReport } from "./subscription-rollup-report.js";
import { SubscriptionRollup, newSubscriptionRollup } from "./subscription-rollup.js";

test("SubscriptionRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_212_428);
  const items: SubscriptionRollup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSubscriptionRollup(`subscription-rollup-${index}`, "sample"));
  }
  const report = buildSubscriptionRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
