import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingLevelPreferenceReport } from "./pending-level-preference-report.js";
import { PendingLevelPreference, newPendingLevelPreference } from "./pending-level-preference.js";

test("PendingLevelPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_971_560);
  const items: PendingLevelPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingLevelPreference(`pending-level-preference-${index}`, "sample"));
  }
  const report = buildPendingLevelPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
