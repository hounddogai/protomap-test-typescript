import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackConversionMappingReport } from "./fallback-conversion-mapping-report.js";
import { FallbackConversionMapping, newFallbackConversionMapping } from "./fallback-conversion-mapping.js";

test("FallbackConversionMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_710_800);
  const items: FallbackConversionMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackConversionMapping(`fallback-conversion-mapping-${index}`, "sample"));
  }
  const report = buildFallbackConversionMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
