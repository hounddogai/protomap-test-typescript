import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualTouchpointPolicyReport } from "./manual-touchpoint-policy-report.js";
import { ManualTouchpointPolicy, newManualTouchpointPolicy } from "./manual-touchpoint-policy.js";

test("ManualTouchpointPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_123_611);
  const items: ManualTouchpointPolicy[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newManualTouchpointPolicy(`manual-touchpoint-policy-${index}`, "sample"));
  }
  const report = buildManualTouchpointPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
