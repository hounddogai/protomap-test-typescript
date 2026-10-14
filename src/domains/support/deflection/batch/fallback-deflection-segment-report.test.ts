import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackDeflectionSegmentReport } from "./fallback-deflection-segment-report.js";
import { FallbackDeflectionSegment, newFallbackDeflectionSegment } from "./fallback-deflection-segment.js";

test("FallbackDeflectionSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_644_894);
  const items: FallbackDeflectionSegment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackDeflectionSegment(`fallback-deflection-segment-${index}`, "sample"));
  }
  const report = buildFallbackDeflectionSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
