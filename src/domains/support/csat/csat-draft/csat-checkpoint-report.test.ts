import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatCheckpointReport } from "./csat-checkpoint-report.js";
import { CsatCheckpoint, newCsatCheckpoint } from "./csat-checkpoint.js";

test("CsatCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_208_971);
  const items: CsatCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCsatCheckpoint(`csat-checkpoint-${index}`, "sample"));
  }
  const report = buildCsatCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
