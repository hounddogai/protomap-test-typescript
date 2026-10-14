import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyPayoutBundleReport } from "./legacy-payout-bundle-report.js";
import { LegacyPayoutBundle, newLegacyPayoutBundle } from "./legacy-payout-bundle.js";

test("LegacyPayoutBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_340_239);
  const items: LegacyPayoutBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyPayoutBundle(`legacy-payout-bundle-${index}`, "sample"));
  }
  const report = buildLegacyPayoutBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
