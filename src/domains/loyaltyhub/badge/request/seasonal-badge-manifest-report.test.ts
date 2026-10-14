import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalBadgeManifestReport } from "./seasonal-badge-manifest-report.js";
import { SeasonalBadgeManifest, newSeasonalBadgeManifest } from "./seasonal-badge-manifest.js";

test("SeasonalBadgeManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_787_122);
  const items: SeasonalBadgeManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSeasonalBadgeManifest(`seasonal-badge-manifest-${index}`, "sample"));
  }
  const report = buildSeasonalBadgeManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
