import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalTierManifestReport } from "./global-tier-manifest-report.js";
import { GlobalTierManifest, newGlobalTierManifest } from "./global-tier-manifest.js";

test("GlobalTierManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_997_294);
  const items: GlobalTierManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalTierManifest(`global-tier-manifest-${index}`, "sample"));
  }
  const report = buildGlobalTierManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
