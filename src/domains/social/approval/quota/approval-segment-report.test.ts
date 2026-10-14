import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalSegmentReport } from "./approval-segment-report.js";
import { ApprovalSegment, newApprovalSegment } from "./approval-segment.js";

test("ApprovalSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_512_330);
  const items: ApprovalSegment[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newApprovalSegment(`approval-segment-${index}`, "sample"));
  }
  const report = buildApprovalSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
