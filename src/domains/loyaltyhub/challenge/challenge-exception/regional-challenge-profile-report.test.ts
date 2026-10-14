import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalChallengeProfileReport } from "./regional-challenge-profile-report.js";
import { RegionalChallengeProfile, newRegionalChallengeProfile } from "./regional-challenge-profile.js";

test("RegionalChallengeProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_947_895);
  const items: RegionalChallengeProfile[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalChallengeProfile(`regional-challenge-profile-${index}`, "sample"));
  }
  const report = buildRegionalChallengeProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
