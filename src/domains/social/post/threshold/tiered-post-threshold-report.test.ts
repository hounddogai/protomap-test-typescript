import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredPostThresholdReport } from "./tiered-post-threshold-report.js";
import { TieredPostThreshold, newTieredPostThreshold } from "./tiered-post-threshold.js";

test("TieredPostThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_450_427);
  const items: TieredPostThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredPostThreshold(`tiered-post-threshold-${index}`, "sample"));
  }
  const report = buildTieredPostThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
