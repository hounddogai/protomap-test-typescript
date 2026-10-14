import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualTouchpointBundleReport } from "./manual-touchpoint-bundle-report.js";
import { ManualTouchpointBundle, newManualTouchpointBundle } from "./manual-touchpoint-bundle.js";

test("ManualTouchpointBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_717_630);
  const items: ManualTouchpointBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newManualTouchpointBundle(`manual-touchpoint-bundle-${index}`, "sample"));
  }
  const report = buildManualTouchpointBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
