import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBatchedCreditOverrideReport } from "./batched-credit-override-report.js";
import { BatchedCreditOverride, newBatchedCreditOverride } from "./batched-credit-override.js";

test("BatchedCreditOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_223_041);
  const items: BatchedCreditOverride[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBatchedCreditOverride(`batched-credit-override-${index}`, "sample"));
  }
  const report = buildBatchedCreditOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
