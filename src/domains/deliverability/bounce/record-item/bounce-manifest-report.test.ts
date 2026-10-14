import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceManifestReport } from "./bounce-manifest-report.js";
import { BounceManifest, newBounceManifest } from "./bounce-manifest.js";

test("BounceManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_443_135);
  const items: BounceManifest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBounceManifest(`bounce-manifest-${index}`, "sample"));
  }
  const report = buildBounceManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
