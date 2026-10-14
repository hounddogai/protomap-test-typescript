import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelPreferenceReport } from "./level-preference-report.js";
import { LevelPreference, newLevelPreference } from "./level-preference.js";

test("LevelPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_204_859);
  const items: LevelPreference[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLevelPreference(`level-preference-${index}`, "sample"));
  }
  const report = buildLevelPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
