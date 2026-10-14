import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderWindowReport } from "./sender-window-report.js";
import { SenderWindow, newSenderWindow } from "./sender-window.js";

test("SenderWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_098_307);
  const items: SenderWindow[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSenderWindow(`sender-window-${index}`, "sample"));
  }
  const report = buildSenderWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
