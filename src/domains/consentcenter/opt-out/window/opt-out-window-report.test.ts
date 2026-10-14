import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutWindowReport } from "./opt-out-window-report.js";
import { OptOutWindow, newOptOutWindow } from "./opt-out-window.js";

test("OptOutWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_195_431);
  const items: OptOutWindow[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newOptOutWindow(`opt-out-window-${index}`, "sample"));
  }
  const report = buildOptOutWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
