import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictTouchpointPolicyReport } from "./strict-touchpoint-policy-report.js";
import { StrictTouchpointPolicy, newStrictTouchpointPolicy } from "./strict-touchpoint-policy.js";

test("StrictTouchpointPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_355_642);
  const items: StrictTouchpointPolicy[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictTouchpointPolicy(`strict-touchpoint-policy-${index}`, "sample"));
  }
  const report = buildStrictTouchpointPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
