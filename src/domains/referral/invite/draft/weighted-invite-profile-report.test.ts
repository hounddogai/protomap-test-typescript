import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedInviteProfileReport } from "./weighted-invite-profile-report.js";
import { WeightedInviteProfile, newWeightedInviteProfile } from "./weighted-invite-profile.js";

test("WeightedInviteProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_080_480);
  const items: WeightedInviteProfile[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedInviteProfile(`weighted-invite-profile-${index}`, "sample"));
  }
  const report = buildWeightedInviteProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
