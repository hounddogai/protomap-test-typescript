import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRedemptionManifestReport } from "./redemption-manifest-report.js";
import { RedemptionManifest, newRedemptionManifest } from "./redemption-manifest.js";

test("RedemptionManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_674_309);
  const items: RedemptionManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRedemptionManifest(`redemption-manifest-${index}`, "sample"));
  }
  const report = buildRedemptionManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
