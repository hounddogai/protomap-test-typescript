import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyPathMilestoneReport } from "./legacy-path-milestone-report.js";
import { LegacyPathMilestone, newLegacyPathMilestone } from "./legacy-path-milestone.js";

test("LegacyPathMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_095_058);
  const items: LegacyPathMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyPathMilestone(`legacy-path-milestone-${index}`, "sample"));
  }
  const report = buildLegacyPathMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
