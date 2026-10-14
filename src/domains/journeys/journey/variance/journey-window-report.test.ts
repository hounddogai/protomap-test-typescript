import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildJourneyWindowReport } from "./journey-window-report.js";
import { JourneyWindow, newJourneyWindow } from "./journey-window.js";

test("JourneyWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_982_447);
  const items: JourneyWindow[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newJourneyWindow(`journey-window-${index}`, "sample"));
  }
  const report = buildJourneyWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
