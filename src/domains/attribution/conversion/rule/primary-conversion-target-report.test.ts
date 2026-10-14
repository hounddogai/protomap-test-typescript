import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryConversionTargetReport } from "./primary-conversion-target-report.js";
import { PrimaryConversionTarget, newPrimaryConversionTarget } from "./primary-conversion-target.js";

test("PrimaryConversionTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_370_356);
  const items: PrimaryConversionTarget[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryConversionTarget(`primary-conversion-target-${index}`, "sample"));
  }
  const report = buildPrimaryConversionTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
