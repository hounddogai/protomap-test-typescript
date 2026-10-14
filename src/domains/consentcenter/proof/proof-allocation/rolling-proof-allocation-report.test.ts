import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingProofAllocationReport } from "./rolling-proof-allocation-report.js";
import { RollingProofAllocation, newRollingProofAllocation } from "./rolling-proof-allocation.js";

test("RollingProofAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_169_986);
  const items: RollingProofAllocation[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingProofAllocation(`rolling-proof-allocation-${index}`, "sample"));
  }
  const report = buildRollingProofAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
