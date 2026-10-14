import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeThresholdReport } from "./creative-threshold-report.js";
import { CreativeThreshold, newCreativeThreshold } from "./creative-threshold.js";

test("CreativeThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_448_535);
  const items: CreativeThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCreativeThreshold(`creative-threshold-${index}`, "sample"));
  }
  const report = buildCreativeThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
