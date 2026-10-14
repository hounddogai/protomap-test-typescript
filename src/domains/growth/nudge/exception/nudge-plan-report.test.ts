import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgePlanReport } from "./nudge-plan-report.js";
import { NudgePlan, newNudgePlan } from "./nudge-plan.js";

test("NudgePlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_312_483);
  const items: NudgePlan[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newNudgePlan(`nudge-plan-${index}`, "sample"));
  }
  const report = buildNudgePlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
