import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryWarmupPolicyReport } from "./primary-warmup-policy-report.js";
import { PrimaryWarmupPolicy, newPrimaryWarmupPolicy } from "./primary-warmup-policy.js";

test("PrimaryWarmupPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_267_342);
  const items: PrimaryWarmupPolicy[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryWarmupPolicy(`primary-warmup-policy-${index}`, "sample"));
  }
  const report = buildPrimaryWarmupPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
