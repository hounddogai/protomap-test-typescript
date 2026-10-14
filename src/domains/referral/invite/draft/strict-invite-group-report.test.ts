import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictInviteGroupReport } from "./strict-invite-group-report.js";
import { StrictInviteGroup, newStrictInviteGroup } from "./strict-invite-group.js";

test("StrictInviteGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_486_688);
  const items: StrictInviteGroup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictInviteGroup(`strict-invite-group-${index}`, "sample"));
  }
  const report = buildStrictInviteGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
