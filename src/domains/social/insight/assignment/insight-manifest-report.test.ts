import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightManifestReport } from "./insight-manifest-report.js";
import { InsightManifest, newInsightManifest } from "./insight-manifest.js";

test("InsightManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_183_399);
  const items: InsightManifest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newInsightManifest(`insight-manifest-${index}`, "sample"));
  }
  const report = buildInsightManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
