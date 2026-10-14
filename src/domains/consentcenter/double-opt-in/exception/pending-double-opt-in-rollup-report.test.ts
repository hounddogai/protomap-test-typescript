import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingDoubleOptInRollupReport } from "./pending-double-opt-in-rollup-report.js";
import { PendingDoubleOptInRollup, newPendingDoubleOptInRollup } from "./pending-double-opt-in-rollup.js";

test("PendingDoubleOptInRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_756_005);
  const items: PendingDoubleOptInRollup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingDoubleOptInRollup(`pending-double-opt-in-rollup-${index}`, "sample"));
  }
  const report = buildPendingDoubleOptInRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
