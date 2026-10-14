import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedWaitWindowReport } from "./capped-wait-window-report.js";
import { CappedWaitWindow, newCappedWaitWindow } from "./capped-wait-window.js";

test("CappedWaitWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_803_766);
  const items: CappedWaitWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedWaitWindow(`capped-wait-window-${index}`, "sample"));
  }
  const report = buildCappedWaitWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
