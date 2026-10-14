import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBounceBatchReport } from "./primary-bounce-batch-report.js";
import { PrimaryBounceBatch, newPrimaryBounceBatch } from "./primary-bounce-batch.js";

test("PrimaryBounceBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_637_019);
  const items: PrimaryBounceBatch[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimaryBounceBatch(`primary-bounce-batch-${index}`, "sample"));
  }
  const report = buildPrimaryBounceBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
