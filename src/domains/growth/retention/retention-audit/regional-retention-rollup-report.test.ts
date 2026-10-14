import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalRetentionRollupReport } from "./regional-retention-rollup-report.js";
import { RegionalRetentionRollup, newRegionalRetentionRollup } from "./regional-retention-rollup.js";

test("RegionalRetentionRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_313_489);
  const items: RegionalRetentionRollup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalRetentionRollup(`regional-retention-rollup-${index}`, "sample"));
  }
  const report = buildRegionalRetentionRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
