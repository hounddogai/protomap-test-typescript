import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualRetentionMappingReport } from "./manual-retention-mapping-report.js";
import { ManualRetentionMapping, newManualRetentionMapping } from "./manual-retention-mapping.js";

test("ManualRetentionMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_971_037);
  const items: ManualRetentionMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualRetentionMapping(`manual-retention-mapping-${index}`, "sample"));
  }
  const report = buildManualRetentionMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
