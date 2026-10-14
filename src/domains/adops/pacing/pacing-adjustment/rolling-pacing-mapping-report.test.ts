import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPacingMappingReport } from "./rolling-pacing-mapping-report.js";
import { RollingPacingMapping, newRollingPacingMapping } from "./rolling-pacing-mapping.js";

test("RollingPacingMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_668_871);
  const items: RollingPacingMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingPacingMapping(`rolling-pacing-mapping-${index}`, "sample"));
  }
  const report = buildRollingPacingMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
