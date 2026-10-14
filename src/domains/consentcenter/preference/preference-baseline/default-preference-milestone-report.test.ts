import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPreferenceMilestoneReport } from "./default-preference-milestone-report.js";
import { DefaultPreferenceMilestone, newDefaultPreferenceMilestone } from "./default-preference-milestone.js";

test("DefaultPreferenceMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_397_144);
  const items: DefaultPreferenceMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultPreferenceMilestone(`default-preference-milestone-${index}`, "sample"));
  }
  const report = buildDefaultPreferenceMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
