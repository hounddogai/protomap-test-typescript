import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeProfileReport } from "./badge-profile-report.js";
import { BadgeProfile, newBadgeProfile } from "./badge-profile.js";

test("BadgeProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_144_117);
  const items: BadgeProfile[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBadgeProfile(`badge-profile-${index}`, "sample"));
  }
  const report = buildBadgeProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
