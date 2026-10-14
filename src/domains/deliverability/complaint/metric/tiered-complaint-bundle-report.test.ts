import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredComplaintBundleReport } from "./tiered-complaint-bundle-report.js";
import { TieredComplaintBundle, newTieredComplaintBundle } from "./tiered-complaint-bundle.js";

test("TieredComplaintBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_587_403);
  const items: TieredComplaintBundle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredComplaintBundle(`tiered-complaint-bundle-${index}`, "sample"));
  }
  const report = buildTieredComplaintBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
