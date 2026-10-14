import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofAllocationReport } from "./proof-allocation-report.js";
import { ProofAllocation, newProofAllocation } from "./proof-allocation.js";

test("ProofAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_853_278);
  const items: ProofAllocation[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newProofAllocation(`proof-allocation-${index}`, "sample"));
  }
  const report = buildProofAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
