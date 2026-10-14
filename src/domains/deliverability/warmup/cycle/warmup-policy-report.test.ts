import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupPolicyReport } from "./warmup-policy-report.js";
import { WarmupPolicy, newWarmupPolicy } from "./warmup-policy.js";

test("WarmupPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_364_457);
  const items: WarmupPolicy[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWarmupPolicy(`warmup-policy-${index}`, "sample"));
  }
  const report = buildWarmupPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
