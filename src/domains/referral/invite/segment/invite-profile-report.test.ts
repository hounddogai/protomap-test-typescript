import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInviteProfileReport } from "./invite-profile-report.js";
import { InviteProfile, newInviteProfile } from "./invite-profile.js";

test("InviteProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_675_833);
  const items: InviteProfile[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newInviteProfile(`invite-profile-${index}`, "sample"));
  }
  const report = buildInviteProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
