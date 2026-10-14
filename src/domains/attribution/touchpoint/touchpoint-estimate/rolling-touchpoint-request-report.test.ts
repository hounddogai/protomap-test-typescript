import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingTouchpointRequestReport } from "./rolling-touchpoint-request-report.js";
import { RollingTouchpointRequest, newRollingTouchpointRequest } from "./rolling-touchpoint-request.js";

test("RollingTouchpointRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_510_693);
  const items: RollingTouchpointRequest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingTouchpointRequest(`rolling-touchpoint-request-${index}`, "sample"));
  }
  const report = buildRollingTouchpointRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
