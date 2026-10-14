import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteThresholdReport } from "./invite-threshold-report.js";
import { InviteThreshold, newInviteThreshold } from "./invite-threshold.js";

test("InviteThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_422_610);
  const items: InviteThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newInviteThreshold(`invite-threshold-${index}`, "sample"));
  }
  const report = buildInviteThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
