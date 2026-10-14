import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyModelMilestoneReport } from "./legacy-model-milestone-report.js";
import { LegacyModelMilestone, newLegacyModelMilestone } from "./legacy-model-milestone.js";

test("LegacyModelMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_356_128);
  const items: LegacyModelMilestone[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyModelMilestone(`legacy-model-milestone-${index}`, "sample"));
  }
  const report = buildLegacyModelMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
