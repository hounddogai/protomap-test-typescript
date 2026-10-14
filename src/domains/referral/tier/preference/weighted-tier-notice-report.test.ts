import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedTierNoticeReport } from "./weighted-tier-notice-report.js";
import { WeightedTierNotice, newWeightedTierNotice } from "./weighted-tier-notice.js";

test("WeightedTierNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_862_135);
  const items: WeightedTierNotice[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedTierNotice(`weighted-tier-notice-${index}`, "sample"));
  }
  const report = buildWeightedTierNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
