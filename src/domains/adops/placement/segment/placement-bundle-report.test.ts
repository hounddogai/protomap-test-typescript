import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementBundleReport } from "./placement-bundle-report.js";
import { PlacementBundle, newPlacementBundle } from "./placement-bundle.js";

test("PlacementBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_863_449);
  const items: PlacementBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPlacementBundle(`placement-bundle-${index}`, "sample"));
  }
  const report = buildPlacementBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
