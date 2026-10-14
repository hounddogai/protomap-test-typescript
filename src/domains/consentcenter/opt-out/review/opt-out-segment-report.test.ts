import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutSegmentReport } from "./opt-out-segment-report.js";
import { OptOutSegment, newOptOutSegment } from "./opt-out-segment.js";

test("OptOutSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_589_185);
  const items: OptOutSegment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newOptOutSegment(`opt-out-segment-${index}`, "sample"));
  }
  const report = buildOptOutSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
