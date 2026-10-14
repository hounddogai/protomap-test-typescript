import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalSuppressionBundleReport } from "./seasonal-suppression-bundle-report.js";
import { SeasonalSuppressionBundle, newSeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

test("SeasonalSuppressionBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_553_727);
  const items: SeasonalSuppressionBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalSuppressionBundle(`seasonal-suppression-bundle-${index}`, "sample"));
  }
  const report = buildSeasonalSuppressionBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
