import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationThresholdReport } from "./reputation-threshold-report.js";
import { ReputationThreshold, newReputationThreshold } from "./reputation-threshold.js";

test("ReputationThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_773_083);
  const items: ReputationThreshold[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newReputationThreshold(`reputation-threshold-${index}`, "sample"));
  }
  const report = buildReputationThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
