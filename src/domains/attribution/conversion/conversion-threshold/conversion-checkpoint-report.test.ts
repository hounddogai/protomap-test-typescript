import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildConversionCheckpointReport } from "./conversion-checkpoint-report.js";
import { ConversionCheckpoint, newConversionCheckpoint } from "./conversion-checkpoint.js";

test("ConversionCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_452_622);
  const items: ConversionCheckpoint[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newConversionCheckpoint(`conversion-checkpoint-${index}`, "sample"));
  }
  const report = buildConversionCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
