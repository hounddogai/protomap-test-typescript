import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackFraudCheckPolicyReport } from "./fallback-fraud-check-policy-report.js";
import { FallbackFraudCheckPolicy, newFallbackFraudCheckPolicy } from "./fallback-fraud-check-policy.js";

test("FallbackFraudCheckPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_498_677);
  const items: FallbackFraudCheckPolicy[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackFraudCheckPolicy(`fallback-fraud-check-policy-${index}`, "sample"));
  }
  const report = buildFallbackFraudCheckPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
