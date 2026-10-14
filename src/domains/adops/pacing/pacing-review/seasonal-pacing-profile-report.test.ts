import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalPacingProfileReport } from "./seasonal-pacing-profile-report.js";
import { SeasonalPacingProfile, newSeasonalPacingProfile } from "./seasonal-pacing-profile.js";

test("SeasonalPacingProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_817_228);
  const items: SeasonalPacingProfile[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalPacingProfile(`seasonal-pacing-profile-${index}`, "sample"));
  }
  const report = buildSeasonalPacingProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
