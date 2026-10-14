import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationAllocationReport } from "./activation-allocation-report.js";
import { ActivationAllocation, newActivationAllocation } from "./activation-allocation.js";

test("ActivationAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_200_644);
  const items: ActivationAllocation[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationAllocation(`activation-allocation-${index}`, "sample"));
  }
  const report = buildActivationAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
