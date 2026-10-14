import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryPayoutManifestReport } from "./primary-payout-manifest-report.js";
import { PrimaryPayoutManifest, newPrimaryPayoutManifest } from "./primary-payout-manifest.js";

test("PrimaryPayoutManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_216_583);
  const items: PrimaryPayoutManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryPayoutManifest(`primary-payout-manifest-${index}`, "sample"));
  }
  const report = buildPrimaryPayoutManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
