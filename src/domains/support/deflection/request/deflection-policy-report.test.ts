import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionPolicyReport } from "./deflection-policy-report.js";
import { DeflectionPolicy, newDeflectionPolicy } from "./deflection-policy.js";

test("DeflectionPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_645_431);
  const items: DeflectionPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDeflectionPolicy(`deflection-policy-${index}`, "sample"));
  }
  const report = buildDeflectionPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
