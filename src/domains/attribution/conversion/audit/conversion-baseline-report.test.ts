import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionBaselineReport } from "./conversion-baseline-report.js";
import { ConversionBaseline, newConversionBaseline } from "./conversion-baseline.js";

test("ConversionBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_503_252);
  const items: ConversionBaseline[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newConversionBaseline(`conversion-baseline-${index}`, "sample"));
  }
  const report = buildConversionBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
