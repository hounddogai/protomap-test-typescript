import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingRewardRequestReport } from "./rolling-reward-request-report.js";
import { RollingRewardRequest, newRollingRewardRequest } from "./rolling-reward-request.js";

test("RollingRewardRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_752_937);
  const items: RollingRewardRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingRewardRequest(`rolling-reward-request-${index}`, "sample"));
  }
  const report = buildRollingRewardRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
