import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofCycleReport } from "./proof-cycle-report.js";
import { ProofCycle, newProofCycle } from "./proof-cycle.js";

test("ProofCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_098_327);
  const items: ProofCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newProofCycle(`proof-cycle-${index}`, "sample"));
  }
  const report = buildProofCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
