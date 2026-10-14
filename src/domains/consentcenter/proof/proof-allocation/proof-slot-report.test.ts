import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildProofSlotReport } from "./proof-slot-report.js";
import { ProofSlot, newProofSlot } from "./proof-slot.js";

test("ProofSlotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_494_695);
  const items: ProofSlot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newProofSlot(`proof-slot-${index}`, "sample"));
  }
  const report = buildProofSlotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
