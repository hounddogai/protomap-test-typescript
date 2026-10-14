import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedExitRuleDigestReport } from "./weighted-exit-rule-digest-report.js";
import { WeightedExitRuleDigest, newWeightedExitRuleDigest } from "./weighted-exit-rule-digest.js";

test("WeightedExitRuleDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_556_568);
  const items: WeightedExitRuleDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedExitRuleDigest(`weighted-exit-rule-digest-${index}`, "sample"));
  }
  const report = buildWeightedExitRuleDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
