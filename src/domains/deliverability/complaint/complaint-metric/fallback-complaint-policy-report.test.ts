import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackComplaintPolicyReport } from "./fallback-complaint-policy-report.js";
import { FallbackComplaintPolicy, newFallbackComplaintPolicy } from "./fallback-complaint-policy.js";

test("FallbackComplaintPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_635_196);
  const items: FallbackComplaintPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackComplaintPolicy(`fallback-complaint-policy-${index}`, "sample"));
  }
  const report = buildFallbackComplaintPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
