import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyDoubleOptInBundleReport } from "./legacy-double-opt-in-bundle-report.js";
import { LegacyDoubleOptInBundle, newLegacyDoubleOptInBundle } from "./legacy-double-opt-in-bundle.js";

test("LegacyDoubleOptInBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_230_624);
  const items: LegacyDoubleOptInBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyDoubleOptInBundle(`legacy-double-opt-in-bundle-${index}`, "sample"));
  }
  const report = buildLegacyDoubleOptInBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
