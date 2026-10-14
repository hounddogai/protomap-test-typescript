import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyFraudCheckBundleReport } from "./legacy-fraud-check-bundle-report.js";
import { LegacyFraudCheckBundle, newLegacyFraudCheckBundle } from "./legacy-fraud-check-bundle.js";

test("LegacyFraudCheckBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_092_160);
  const items: LegacyFraudCheckBundle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLegacyFraudCheckBundle(`legacy-fraud-check-bundle-${index}`, "sample"));
  }
  const report = buildLegacyFraudCheckBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
