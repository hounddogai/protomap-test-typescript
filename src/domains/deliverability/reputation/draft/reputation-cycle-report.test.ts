import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReputationCycleReport } from "./reputation-cycle-report.js";
import { ReputationCycle, newReputationCycle } from "./reputation-cycle.js";

test("ReputationCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_636_468);
  const items: ReputationCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newReputationCycle(`reputation-cycle-${index}`, "sample"));
  }
  const report = buildReputationCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
