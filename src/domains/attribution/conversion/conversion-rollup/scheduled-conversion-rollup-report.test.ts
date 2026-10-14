import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledConversionRollupReport } from "./scheduled-conversion-rollup-report.js";
import { ScheduledConversionRollup, newScheduledConversionRollup } from "./scheduled-conversion-rollup.js";

test("ScheduledConversionRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_649_558);
  const items: ScheduledConversionRollup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledConversionRollup(`scheduled-conversion-rollup-${index}`, "sample"));
  }
  const report = buildScheduledConversionRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
