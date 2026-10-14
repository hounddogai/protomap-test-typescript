import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatCycleReport } from "./csat-cycle-report.js";
import { CsatCycle, newCsatCycle } from "./csat-cycle.js";

test("CsatCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_437_157);
  const items: CsatCycle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCsatCycle(`csat-cycle-${index}`, "sample"));
  }
  const report = buildCsatCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
