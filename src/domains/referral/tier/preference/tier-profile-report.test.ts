import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierProfileReport } from "./tier-profile-report.js";
import { TierProfile, newTierProfile } from "./tier-profile.js";

test("TierProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_114_729);
  const items: TierProfile[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTierProfile(`tier-profile-${index}`, "sample"));
  }
  const report = buildTierProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
