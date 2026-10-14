import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalReplyWindowReport } from "./seasonal-reply-window-report.js";
import { SeasonalReplyWindow, newSeasonalReplyWindow } from "./seasonal-reply-window.js";

test("SeasonalReplyWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_741_986);
  const items: SeasonalReplyWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSeasonalReplyWindow(`seasonal-reply-window-${index}`, "sample"));
  }
  const report = buildSeasonalReplyWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
