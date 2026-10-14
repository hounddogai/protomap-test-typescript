import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathThresholdReport } from "./path-threshold-report.js";
import { PathThreshold, newPathThreshold } from "./path-threshold.js";

test("PathThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_246_914);
  const items: PathThreshold[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPathThreshold(`path-threshold-${index}`, "sample"));
  }
  const report = buildPathThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
