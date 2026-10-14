import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingCreativeBundleReport } from "./pending-creative-bundle-report.js";
import { PendingCreativeBundle, newPendingCreativeBundle } from "./pending-creative-bundle.js";

test("PendingCreativeBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_663_385);
  const items: PendingCreativeBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPendingCreativeBundle(`pending-creative-bundle-${index}`, "sample"));
  }
  const report = buildPendingCreativeBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
