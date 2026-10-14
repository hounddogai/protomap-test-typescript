import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredOptOutOverrideReport } from "./tiered-opt-out-override-report.js";
import { TieredOptOutOverride, newTieredOptOutOverride } from "./tiered-opt-out-override.js";

test("TieredOptOutOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_474_385);
  const items: TieredOptOutOverride[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredOptOutOverride(`tiered-opt-out-override-${index}`, "sample"));
  }
  const report = buildTieredOptOutOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
