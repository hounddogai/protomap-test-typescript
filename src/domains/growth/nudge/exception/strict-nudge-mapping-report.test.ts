import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictNudgeMappingReport } from "./strict-nudge-mapping-report.js";
import { StrictNudgeMapping, newStrictNudgeMapping } from "./strict-nudge-mapping.js";

test("StrictNudgeMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_646_649);
  const items: StrictNudgeMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictNudgeMapping(`strict-nudge-mapping-${index}`, "sample"));
  }
  const report = buildStrictNudgeMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
