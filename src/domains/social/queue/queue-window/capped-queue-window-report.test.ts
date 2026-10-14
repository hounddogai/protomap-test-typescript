import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedQueueWindowReport } from "./capped-queue-window-report.js";
import { CappedQueueWindow, newCappedQueueWindow } from "./capped-queue-window.js";

test("CappedQueueWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_568_561);
  const items: CappedQueueWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedQueueWindow(`capped-queue-window-${index}`, "sample"));
  }
  const report = buildCappedQueueWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
