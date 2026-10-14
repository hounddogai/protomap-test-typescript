import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteTierReport } from "./invite-tier-report.js";
import { InviteTier, newInviteTier } from "./invite-tier.js";

test("InviteTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_253_574);
  const items: InviteTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newInviteTier(`invite-tier-${index}`, "sample"));
  }
  const report = buildInviteTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
