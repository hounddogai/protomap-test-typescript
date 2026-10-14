import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofPlanReport } from "./proof-plan-report.js";
import { ProofPlan, newProofPlan } from "./proof-plan.js";

test("ProofPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_620_632);
  const items: ProofPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newProofPlan(`proof-plan-${index}`, "sample"));
  }
  const report = buildProofPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
