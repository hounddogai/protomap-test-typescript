import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedNudgeMappingReport } from "./capped-nudge-mapping-report.js";
import { CappedNudgeMapping, newCappedNudgeMapping } from "./capped-nudge-mapping.js";

test("CappedNudgeMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_095_819);
  const items: CappedNudgeMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedNudgeMapping(`capped-nudge-mapping-${index}`, "sample"));
  }
  const report = buildCappedNudgeMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
