import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingCsatPolicyReport } from "./pending-csat-policy-report.js";
import { PendingCsatPolicy, newPendingCsatPolicy } from "./pending-csat-policy.js";

test("PendingCsatPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_721_649);
  const items: PendingCsatPolicy[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingCsatPolicy(`pending-csat-policy-${index}`, "sample"));
  }
  const report = buildPendingCsatPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
