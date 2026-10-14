import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalWarmupWindowReport } from "./seasonal-warmup-window-report.js";
import { SeasonalWarmupWindow, newSeasonalWarmupWindow } from "./seasonal-warmup-window.js";

test("SeasonalWarmupWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_967_259);
  const items: SeasonalWarmupWindow[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSeasonalWarmupWindow(`seasonal-warmup-window-${index}`, "sample"));
  }
  const report = buildSeasonalWarmupWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
