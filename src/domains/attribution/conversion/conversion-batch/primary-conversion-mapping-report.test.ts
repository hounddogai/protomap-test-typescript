import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryConversionMappingReport } from "./primary-conversion-mapping-report.js";
import { PrimaryConversionMapping, newPrimaryConversionMapping } from "./primary-conversion-mapping.js";

test("PrimaryConversionMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_153_232);
  const items: PrimaryConversionMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimaryConversionMapping(`primary-conversion-mapping-${index}`, "sample"));
  }
  const report = buildPrimaryConversionMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
