import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyBadgeManifestReport } from "./legacy-badge-manifest-report.js";
import { LegacyBadgeManifest, newLegacyBadgeManifest } from "./legacy-badge-manifest.js";

test("LegacyBadgeManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_714_480);
  const items: LegacyBadgeManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyBadgeManifest(`legacy-badge-manifest-${index}`, "sample"));
  }
  const report = buildLegacyBadgeManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
