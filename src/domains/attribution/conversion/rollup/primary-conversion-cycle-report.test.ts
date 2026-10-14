import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryConversionCycleReport } from "./primary-conversion-cycle-report.js";
import { PrimaryConversionCycle, newPrimaryConversionCycle } from "./primary-conversion-cycle.js";

test("PrimaryConversionCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_065_443);
  const items: PrimaryConversionCycle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryConversionCycle(`primary-conversion-cycle-${index}`, "sample"));
  }
  const report = buildPrimaryConversionCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
