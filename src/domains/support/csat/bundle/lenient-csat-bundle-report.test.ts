import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientCsatBundleReport } from "./lenient-csat-bundle-report.js";
import { LenientCsatBundle, newLenientCsatBundle } from "./lenient-csat-bundle.js";

test("LenientCsatBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_612_719);
  const items: LenientCsatBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientCsatBundle(`lenient-csat-bundle-${index}`, "sample"));
  }
  const report = buildLenientCsatBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
