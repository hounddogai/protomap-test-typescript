import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackCreativePreferenceReport } from "./fallback-creative-preference-report.js";
import { FallbackCreativePreference, newFallbackCreativePreference } from "./fallback-creative-preference.js";

test("FallbackCreativePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_262_933);
  const items: FallbackCreativePreference[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackCreativePreference(`fallback-creative-preference-${index}`, "sample"));
  }
  const report = buildFallbackCreativePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
