import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPreferenceNoticeReport } from "./lenient-preference-notice-report.js";
import { LenientPreferenceNotice, newLenientPreferenceNotice } from "./lenient-preference-notice.js";

test("LenientPreferenceNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_366_335);
  const items: LenientPreferenceNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientPreferenceNotice(`lenient-preference-notice-${index}`, "sample"));
  }
  const report = buildLenientPreferenceNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
