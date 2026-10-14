import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalBadgeProfileReport } from "./global-badge-profile-report.js";
import { GlobalBadgeProfile, newGlobalBadgeProfile } from "./global-badge-profile.js";

test("GlobalBadgeProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_470_679);
  const items: GlobalBadgeProfile[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalBadgeProfile(`global-badge-profile-${index}`, "sample"));
  }
  const report = buildGlobalBadgeProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
