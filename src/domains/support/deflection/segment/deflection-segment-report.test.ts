import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionSegmentReport } from "./deflection-segment-report.js";
import { DeflectionSegment, newDeflectionSegment } from "./deflection-segment.js";

test("DeflectionSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_184_037);
  const items: DeflectionSegment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDeflectionSegment(`deflection-segment-${index}`, "sample"));
  }
  const report = buildDeflectionSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
