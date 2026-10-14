import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSeasonalLevelWindowReport } from "./seasonal-level-window-report.js";
import { SeasonalLevelWindow, newSeasonalLevelWindow } from "./seasonal-level-window.js";

test("SeasonalLevelWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_141_311);
  const items: SeasonalLevelWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSeasonalLevelWindow(`seasonal-level-window-${index}`, "sample"));
  }
  const report = buildSeasonalLevelWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
