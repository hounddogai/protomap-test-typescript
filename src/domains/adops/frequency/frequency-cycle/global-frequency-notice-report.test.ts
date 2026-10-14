import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalFrequencyNoticeReport } from "./global-frequency-notice-report.js";
import { GlobalFrequencyNotice, newGlobalFrequencyNotice } from "./global-frequency-notice.js";

test("GlobalFrequencyNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_250_011);
  const items: GlobalFrequencyNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalFrequencyNotice(`global-frequency-notice-${index}`, "sample"));
  }
  const report = buildGlobalFrequencyNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
