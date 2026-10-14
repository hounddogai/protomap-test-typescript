import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBouncePlanReport } from "./bounce-plan-report.js";
import { BouncePlan, newBouncePlan } from "./bounce-plan.js";

test("BouncePlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_716_255);
  const items: BouncePlan[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBouncePlan(`bounce-plan-${index}`, "sample"));
  }
  const report = buildBouncePlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
