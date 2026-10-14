import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionPlanReport } from "./mention-plan-report.js";
import { MentionPlan, newMentionPlan } from "./mention-plan.js";

test("MentionPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_438_362);
  const items: MentionPlan[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newMentionPlan(`mention-plan-${index}`, "sample"));
  }
  const report = buildMentionPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
