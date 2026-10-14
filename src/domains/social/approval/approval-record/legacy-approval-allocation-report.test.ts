import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyApprovalAllocationReport } from "./legacy-approval-allocation-report.js";
import { LegacyApprovalAllocation, newLegacyApprovalAllocation } from "./legacy-approval-allocation.js";

test("LegacyApprovalAllocationReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_569_843);
  const items: LegacyApprovalAllocation[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyApprovalAllocation(`legacy-approval-allocation-${index}`, "sample"));
  }
  const report = buildLegacyApprovalAllocationReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
