import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingInviteTierReport } from "./rolling-invite-tier-report.js";
import { RollingInviteTier, newRollingInviteTier } from "./rolling-invite-tier.js";

test("RollingInviteTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_485_749);
  const items: RollingInviteTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingInviteTier(`rolling-invite-tier-${index}`, "sample"));
  }
  const report = buildRollingInviteTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
