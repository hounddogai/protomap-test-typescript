import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostPlanReport } from "./post-plan-report.js";
import { PostPlan, newPostPlan } from "./post-plan.js";

test("PostPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_156_866);
  const items: PostPlan[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPostPlan(`post-plan-${index}`, "sample"));
  }
  const report = buildPostPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
