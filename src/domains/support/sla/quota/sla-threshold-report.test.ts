import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaThresholdReport } from "./sla-threshold-report.js";
import { SlaThreshold, newSlaThreshold } from "./sla-threshold.js";

test("SlaThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_067_114);
  const items: SlaThreshold[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSlaThreshold(`sla-threshold-${index}`, "sample"));
  }
  const report = buildSlaThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
