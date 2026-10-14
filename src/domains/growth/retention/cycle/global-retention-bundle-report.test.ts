import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalRetentionBundleReport } from "./global-retention-bundle-report.js";
import { GlobalRetentionBundle, newGlobalRetentionBundle } from "./global-retention-bundle.js";

test("GlobalRetentionBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_789_011);
  const items: GlobalRetentionBundle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newGlobalRetentionBundle(`global-retention-bundle-${index}`, "sample"));
  }
  const report = buildGlobalRetentionBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
