import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionGroupReport } from "./conversion-group-report.js";
import { ConversionGroup, newConversionGroup } from "./conversion-group.js";

test("ConversionGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_135_445);
  const items: ConversionGroup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newConversionGroup(`conversion-group-${index}`, "sample"));
  }
  const report = buildConversionGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
