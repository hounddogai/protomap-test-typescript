import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackStreakBundleReport } from "./fallback-streak-bundle-report.js";
import { FallbackStreakBundle, newFallbackStreakBundle } from "./fallback-streak-bundle.js";

test("FallbackStreakBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_338_016);
  const items: FallbackStreakBundle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackStreakBundle(`fallback-streak-bundle-${index}`, "sample"));
  }
  const report = buildFallbackStreakBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
