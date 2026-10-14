import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupBundleReport } from "./warmup-bundle-report.js";
import { WarmupBundle, newWarmupBundle } from "./warmup-bundle.js";

test("WarmupBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_888_703);
  const items: WarmupBundle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWarmupBundle(`warmup-bundle-${index}`, "sample"));
  }
  const report = buildWarmupBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
