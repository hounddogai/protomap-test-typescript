import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredFrequencyNoticeReport } from "./tiered-frequency-notice-report.js";
import { TieredFrequencyNotice, newTieredFrequencyNotice } from "./tiered-frequency-notice.js";

test("TieredFrequencyNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_721_422);
  const items: TieredFrequencyNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTieredFrequencyNotice(`tiered-frequency-notice-${index}`, "sample"));
  }
  const report = buildTieredFrequencyNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
