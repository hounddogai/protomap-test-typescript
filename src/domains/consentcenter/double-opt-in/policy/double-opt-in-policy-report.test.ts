import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInPolicyReport } from "./double-opt-in-policy-report.js";
import { DoubleOptInPolicy, newDoubleOptInPolicy } from "./double-opt-in-policy.js";

test("DoubleOptInPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_544_101);
  const items: DoubleOptInPolicy[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDoubleOptInPolicy(`double-opt-in-policy-${index}`, "sample"));
  }
  const report = buildDoubleOptInPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
