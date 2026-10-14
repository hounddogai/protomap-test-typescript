import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientTierMappingReport } from "./lenient-tier-mapping-report.js";
import { LenientTierMapping, newLenientTierMapping } from "./lenient-tier-mapping.js";

test("LenientTierMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_839_671);
  const items: LenientTierMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientTierMapping(`lenient-tier-mapping-${index}`, "sample"));
  }
  const report = buildLenientTierMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
