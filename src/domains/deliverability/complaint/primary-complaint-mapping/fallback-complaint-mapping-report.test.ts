import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackComplaintMappingReport } from "./fallback-complaint-mapping-report.js";
import { FallbackComplaintMapping, newFallbackComplaintMapping } from "./fallback-complaint-mapping.js";

test("FallbackComplaintMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_389_535);
  const items: FallbackComplaintMapping[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newFallbackComplaintMapping(`fallback-complaint-mapping-${index}`, "sample"));
  }
  const report = buildFallbackComplaintMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
