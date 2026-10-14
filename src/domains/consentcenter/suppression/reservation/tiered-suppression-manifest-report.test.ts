import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredSuppressionManifestReport } from "./tiered-suppression-manifest-report.js";
import { TieredSuppressionManifest, newTieredSuppressionManifest } from "./tiered-suppression-manifest.js";

test("TieredSuppressionManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_262_808);
  const items: TieredSuppressionManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredSuppressionManifest(`tiered-suppression-manifest-${index}`, "sample"));
  }
  const report = buildTieredSuppressionManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
