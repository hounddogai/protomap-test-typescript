import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictInsightRollupReport } from "./strict-insight-rollup-report.js";
import { StrictInsightRollup, newStrictInsightRollup } from "./strict-insight-rollup.js";

test("StrictInsightRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_231_153);
  const items: StrictInsightRollup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictInsightRollup(`strict-insight-rollup-${index}`, "sample"));
  }
  const report = buildStrictInsightRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
