import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatMilestoneReport } from "./csat-milestone-report.js";
import { CsatMilestone, newCsatMilestone } from "./csat-milestone.js";

test("CsatMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_760_149);
  const items: CsatMilestone[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCsatMilestone(`csat-milestone-${index}`, "sample"));
  }
  const report = buildCsatMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
