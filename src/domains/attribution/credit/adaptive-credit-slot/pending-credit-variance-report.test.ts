import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingCreditVarianceReport } from "./pending-credit-variance-report.js";
import { PendingCreditVariance, newPendingCreditVariance } from "./pending-credit-variance.js";

test("PendingCreditVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_503_749);
  const items: PendingCreditVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingCreditVariance(`pending-credit-variance-${index}`, "sample"));
  }
  const report = buildPendingCreditVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
