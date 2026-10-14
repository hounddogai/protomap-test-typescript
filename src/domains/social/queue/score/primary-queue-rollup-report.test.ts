import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryQueueRollupReport } from "./primary-queue-rollup-report.js";
import { PrimaryQueueRollup, newPrimaryQueueRollup } from "./primary-queue-rollup.js";

test("PrimaryQueueRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_485_504);
  const items: PrimaryQueueRollup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryQueueRollup(`primary-queue-rollup-${index}`, "sample"));
  }
  const report = buildPrimaryQueueRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
