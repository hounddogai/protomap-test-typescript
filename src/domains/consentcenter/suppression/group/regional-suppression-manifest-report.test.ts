import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalSuppressionManifestReport } from "./regional-suppression-manifest-report.js";
import { RegionalSuppressionManifest, newRegionalSuppressionManifest } from "./regional-suppression-manifest.js";

test("RegionalSuppressionManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_011_410);
  const items: RegionalSuppressionManifest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRegionalSuppressionManifest(`regional-suppression-manifest-${index}`, "sample"));
  }
  const report = buildRegionalSuppressionManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
