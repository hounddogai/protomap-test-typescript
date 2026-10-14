import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteClaimReport } from "./invite-claim-report.js";
import { InviteClaim, newInviteClaim } from "./invite-claim.js";

test("InviteClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_231_776);
  const items: InviteClaim[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newInviteClaim(`invite-claim-${index}`, "sample"));
  }
  const report = buildInviteClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
