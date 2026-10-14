import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredInsightAssignmentReport } from "./tiered-insight-assignment-report.js";
import { TieredInsightAssignment, newTieredInsightAssignment } from "./tiered-insight-assignment.js";

test("TieredInsightAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_359_968);
  const items: TieredInsightAssignment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredInsightAssignment(`tiered-insight-assignment-${index}`, "sample"));
  }
  const report = buildTieredInsightAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
