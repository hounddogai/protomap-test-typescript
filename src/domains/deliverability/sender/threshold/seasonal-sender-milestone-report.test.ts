import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSenderMilestoneReport } from "./seasonal-sender-milestone-report.js";
import { SeasonalSenderMilestone, newSeasonalSenderMilestone } from "./seasonal-sender-milestone.js";

test("SeasonalSenderMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_655_953);
  const items: SeasonalSenderMilestone[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalSenderMilestone(`seasonal-sender-milestone-${index}`, "sample"));
  }
  const report = buildSeasonalSenderMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
