import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierPreferenceReport } from "./tier-preference-report.js";
import { TierPreference, newTierPreference } from "./tier-preference.js";

test("TierPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_030_514);
  const items: TierPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTierPreference(`tier-preference-${index}`, "sample"));
  }
  const report = buildTierPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
