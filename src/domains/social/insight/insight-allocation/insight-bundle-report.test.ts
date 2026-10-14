import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildInsightBundleReport } from "./insight-bundle-report.js";
import { InsightBundle, newInsightBundle } from "./insight-bundle.js";

test("InsightBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_109_780);
  const items: InsightBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newInsightBundle(`insight-bundle-${index}`, "sample"));
  }
  const report = buildInsightBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
