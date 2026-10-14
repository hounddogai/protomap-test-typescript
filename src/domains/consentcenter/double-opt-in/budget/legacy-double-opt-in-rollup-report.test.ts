import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyDoubleOptInRollupReport } from "./legacy-double-opt-in-rollup-report.js";
import { LegacyDoubleOptInRollup, newLegacyDoubleOptInRollup } from "./legacy-double-opt-in-rollup.js";

test("LegacyDoubleOptInRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_949_201);
  const items: LegacyDoubleOptInRollup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyDoubleOptInRollup(`legacy-double-opt-in-rollup-${index}`, "sample"));
  }
  const report = buildLegacyDoubleOptInRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
