import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingLevelPolicyReport } from "./rolling-level-policy-report.js";
import { RollingLevelPolicy, newRollingLevelPolicy } from "./rolling-level-policy.js";

test("RollingLevelPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_152_899);
  const items: RollingLevelPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingLevelPolicy(`rolling-level-policy-${index}`, "sample"));
  }
  const report = buildRollingLevelPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
