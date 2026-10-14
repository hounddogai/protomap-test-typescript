import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalSuppressionBundleReport } from "./regional-suppression-bundle-report.js";
import { RegionalSuppressionBundle, newRegionalSuppressionBundle } from "./regional-suppression-bundle.js";

test("RegionalSuppressionBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_720_084);
  const items: RegionalSuppressionBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalSuppressionBundle(`regional-suppression-bundle-${index}`, "sample"));
  }
  const report = buildRegionalSuppressionBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
