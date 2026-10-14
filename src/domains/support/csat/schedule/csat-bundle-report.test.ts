import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatBundleReport } from "./csat-bundle-report.js";
import { CsatBundle, newCsatBundle } from "./csat-bundle.js";

test("CsatBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_466_574);
  const items: CsatBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCsatBundle(`csat-bundle-${index}`, "sample"));
  }
  const report = buildCsatBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
