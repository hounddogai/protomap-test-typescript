import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedCreditCheckpointReport } from "./capped-credit-checkpoint-report.js";
import { CappedCreditCheckpoint, newCappedCreditCheckpoint } from "./capped-credit-checkpoint.js";

test("CappedCreditCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_948_746);
  const items: CappedCreditCheckpoint[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCappedCreditCheckpoint(`capped-credit-checkpoint-${index}`, "sample"));
  }
  const report = buildCappedCreditCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
