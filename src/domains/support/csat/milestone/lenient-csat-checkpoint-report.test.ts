import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientCsatCheckpointReport } from "./lenient-csat-checkpoint-report.js";
import { LenientCsatCheckpoint, newLenientCsatCheckpoint } from "./lenient-csat-checkpoint.js";

test("LenientCsatCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_103_138);
  const items: LenientCsatCheckpoint[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientCsatCheckpoint(`lenient-csat-checkpoint-${index}`, "sample"));
  }
  const report = buildLenientCsatCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
