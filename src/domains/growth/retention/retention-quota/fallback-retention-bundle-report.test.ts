import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackRetentionBundleReport } from "./fallback-retention-bundle-report.js";
import { FallbackRetentionBundle, newFallbackRetentionBundle } from "./fallback-retention-bundle.js";

test("FallbackRetentionBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_338_767);
  const items: FallbackRetentionBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackRetentionBundle(`fallback-retention-bundle-${index}`, "sample"));
  }
  const report = buildFallbackRetentionBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
