import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyTierCheckpointReport } from "./legacy-tier-checkpoint-report.js";
import { LegacyTierCheckpoint, newLegacyTierCheckpoint } from "./legacy-tier-checkpoint.js";

test("LegacyTierCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_995_368);
  const items: LegacyTierCheckpoint[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyTierCheckpoint(`legacy-tier-checkpoint-${index}`, "sample"));
  }
  const report = buildLegacyTierCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
