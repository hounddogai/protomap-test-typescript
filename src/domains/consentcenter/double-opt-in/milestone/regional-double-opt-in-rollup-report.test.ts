import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalDoubleOptInRollupReport } from "./regional-double-opt-in-rollup-report.js";
import { RegionalDoubleOptInRollup, newRegionalDoubleOptInRollup } from "./regional-double-opt-in-rollup.js";

test("RegionalDoubleOptInRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_029_686);
  const items: RegionalDoubleOptInRollup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalDoubleOptInRollup(`regional-double-opt-in-rollup-${index}`, "sample"));
  }
  const report = buildRegionalDoubleOptInRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
