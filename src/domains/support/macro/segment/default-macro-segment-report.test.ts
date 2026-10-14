import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultMacroSegmentReport } from "./default-macro-segment-report.js";
import { DefaultMacroSegment, newDefaultMacroSegment } from "./default-macro-segment.js";

test("DefaultMacroSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_387_502);
  const items: DefaultMacroSegment[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDefaultMacroSegment(`default-macro-segment-${index}`, "sample"));
  }
  const report = buildDefaultMacroSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
