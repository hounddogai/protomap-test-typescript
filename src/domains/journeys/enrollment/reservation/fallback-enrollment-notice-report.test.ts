import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackEnrollmentNoticeReport } from "./fallback-enrollment-notice-report.js";
import { FallbackEnrollmentNotice, newFallbackEnrollmentNotice } from "./fallback-enrollment-notice.js";

test("FallbackEnrollmentNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_101_584);
  const items: FallbackEnrollmentNotice[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackEnrollmentNotice(`fallback-enrollment-notice-${index}`, "sample"));
  }
  const report = buildFallbackEnrollmentNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
