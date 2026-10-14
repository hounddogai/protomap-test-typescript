import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalInviteMilestoneReport } from "./seasonal-invite-milestone-report.js";
import { SeasonalInviteMilestone, newSeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

test("SeasonalInviteMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_056_424);
  const items: SeasonalInviteMilestone[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalInviteMilestone(`seasonal-invite-milestone-${index}`, "sample"));
  }
  const report = buildSeasonalInviteMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
