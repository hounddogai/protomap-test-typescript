import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeBatchReport } from "./badge-batch-report.js";
import { BadgeBatch, newBadgeBatch } from "./badge-batch.js";

test("BadgeBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_779_482);
  const items: BadgeBatch[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBadgeBatch(`badge-batch-${index}`, "sample"));
  }
  const report = buildBadgeBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
