import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientMentionSegmentReport } from "./lenient-mention-segment-report.js";
import { LenientMentionSegment, newLenientMentionSegment } from "./lenient-mention-segment.js";

test("LenientMentionSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_237_719);
  const items: LenientMentionSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientMentionSegment(`lenient-mention-segment-${index}`, "sample"));
  }
  const report = buildLenientMentionSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
