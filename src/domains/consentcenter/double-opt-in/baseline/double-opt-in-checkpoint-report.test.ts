import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDoubleOptInCheckpointReport } from "./double-opt-in-checkpoint-report.js";
import { DoubleOptInCheckpoint, newDoubleOptInCheckpoint } from "./double-opt-in-checkpoint.js";

test("DoubleOptInCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_804_275);
  const items: DoubleOptInCheckpoint[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDoubleOptInCheckpoint(`double-opt-in-checkpoint-${index}`, "sample"));
  }
  const report = buildDoubleOptInCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
