import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalDeflectionCheckpointReport } from "./global-deflection-checkpoint-report.js";
import { GlobalDeflectionCheckpoint, newGlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

test("GlobalDeflectionCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_884_774);
  const items: GlobalDeflectionCheckpoint[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalDeflectionCheckpoint(`global-deflection-checkpoint-${index}`, "sample"));
  }
  const report = buildGlobalDeflectionCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
