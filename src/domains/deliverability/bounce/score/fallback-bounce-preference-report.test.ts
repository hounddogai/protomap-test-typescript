import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackBouncePreferenceReport } from "./fallback-bounce-preference-report.js";
import { FallbackBouncePreference, newFallbackBouncePreference } from "./fallback-bounce-preference.js";

test("FallbackBouncePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_547_534);
  const items: FallbackBouncePreference[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackBouncePreference(`fallback-bounce-preference-${index}`, "sample"));
  }
  const report = buildFallbackBouncePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
