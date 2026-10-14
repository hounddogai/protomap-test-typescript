import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatSegmentReport } from "./csat-segment-report.js";
import { CsatSegment, newCsatSegment } from "./csat-segment.js";

test("CsatSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_982_980);
  const items: CsatSegment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCsatSegment(`csat-segment-${index}`, "sample"));
  }
  const report = buildCsatSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
