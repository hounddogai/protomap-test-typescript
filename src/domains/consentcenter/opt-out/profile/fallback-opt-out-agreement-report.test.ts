import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackOptOutAgreementReport } from "./fallback-opt-out-agreement-report.js";
import { FallbackOptOutAgreement, newFallbackOptOutAgreement } from "./fallback-opt-out-agreement.js";

test("FallbackOptOutAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_333_559);
  const items: FallbackOptOutAgreement[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackOptOutAgreement(`fallback-opt-out-agreement-${index}`, "sample"));
  }
  const report = buildFallbackOptOutAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
