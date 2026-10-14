import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointBatchReport } from "./touchpoint-batch-report.js";
import { TouchpointBatch, newTouchpointBatch } from "./touchpoint-batch.js";

test("TouchpointBatchReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_217_126);
  const items: TouchpointBatch[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTouchpointBatch(`touchpoint-batch-${index}`, "sample"));
  }
  const report = buildTouchpointBatchReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
