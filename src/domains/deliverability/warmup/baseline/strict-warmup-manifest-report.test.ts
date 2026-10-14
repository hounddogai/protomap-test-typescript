import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictWarmupManifestReport } from "./strict-warmup-manifest-report.js";
import { StrictWarmupManifest, newStrictWarmupManifest } from "./strict-warmup-manifest.js";

test("StrictWarmupManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_096_058);
  const items: StrictWarmupManifest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictWarmupManifest(`strict-warmup-manifest-${index}`, "sample"));
  }
  const report = buildStrictWarmupManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
