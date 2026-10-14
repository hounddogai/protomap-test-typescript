import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimarySenderCheckpointReport } from "./primary-sender-checkpoint-report.js";
import { PrimarySenderCheckpoint, newPrimarySenderCheckpoint } from "./primary-sender-checkpoint.js";

test("PrimarySenderCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_246_192);
  const items: PrimarySenderCheckpoint[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimarySenderCheckpoint(`primary-sender-checkpoint-${index}`, "sample"));
  }
  const report = buildPrimarySenderCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
