import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionManifestReport } from "./suppression-manifest-report.js";
import { SuppressionManifest, newSuppressionManifest } from "./suppression-manifest.js";

test("SuppressionManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_691_715);
  const items: SuppressionManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSuppressionManifest(`suppression-manifest-${index}`, "sample"));
  }
  const report = buildSuppressionManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
