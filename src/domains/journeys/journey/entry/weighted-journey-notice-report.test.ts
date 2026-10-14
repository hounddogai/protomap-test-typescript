import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedJourneyNoticeReport } from "./weighted-journey-notice-report.js";
import { WeightedJourneyNotice, newWeightedJourneyNotice } from "./weighted-journey-notice.js";

test("WeightedJourneyNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_335_246);
  const items: WeightedJourneyNotice[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedJourneyNotice(`weighted-journey-notice-${index}`, "sample"));
  }
  const report = buildWeightedJourneyNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
