import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalCreativeNoticeReport } from "./seasonal-creative-notice-report.js";
import { SeasonalCreativeNotice, newSeasonalCreativeNotice } from "./seasonal-creative-notice.js";

test("SeasonalCreativeNoticeReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_084_460);
  const items: SeasonalCreativeNotice[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSeasonalCreativeNotice(`seasonal-creative-notice-${index}`, "sample"));
  }
  const report = buildSeasonalCreativeNoticeReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
