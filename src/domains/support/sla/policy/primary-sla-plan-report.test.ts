import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimarySlaPlanReport } from "./primary-sla-plan-report.js";
import { PrimarySlaPlan, newPrimarySlaPlan } from "./primary-sla-plan.js";

test("PrimarySlaPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_273_417);
  const items: PrimarySlaPlan[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPrimarySlaPlan(`primary-sla-plan-${index}`, "sample"));
  }
  const report = buildPrimarySlaPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
