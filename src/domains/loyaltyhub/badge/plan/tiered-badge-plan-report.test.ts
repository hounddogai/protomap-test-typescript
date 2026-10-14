import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBadgePlanReport } from "./tiered-badge-plan-report.js";
import { TieredBadgePlan, newTieredBadgePlan } from "./tiered-badge-plan.js";

test("TieredBadgePlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_816_712);
  const items: TieredBadgePlan[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTieredBadgePlan(`tiered-badge-plan-${index}`, "sample"));
  }
  const report = buildTieredBadgePlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
