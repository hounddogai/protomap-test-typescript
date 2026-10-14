import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientOptOutCycleReport } from "./lenient-opt-out-cycle-report.js";
import { LenientOptOutCycle, newLenientOptOutCycle } from "./lenient-opt-out-cycle.js";

test("LenientOptOutCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_754_932);
  const items: LenientOptOutCycle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientOptOutCycle(`lenient-opt-out-cycle-${index}`, "sample"));
  }
  const report = buildLenientOptOutCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
