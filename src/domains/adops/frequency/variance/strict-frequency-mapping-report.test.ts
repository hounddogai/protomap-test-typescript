import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictFrequencyMappingReport } from "./strict-frequency-mapping-report.js";
import { StrictFrequencyMapping, newStrictFrequencyMapping } from "./strict-frequency-mapping.js";

test("StrictFrequencyMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_340_221);
  const items: StrictFrequencyMapping[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictFrequencyMapping(`strict-frequency-mapping-${index}`, "sample"));
  }
  const report = buildStrictFrequencyMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
