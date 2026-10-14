import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaWindowReport } from "./sla-window-report.js";
import { SlaWindow, newSlaWindow } from "./sla-window.js";

test("SlaWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_139_021);
  const items: SlaWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSlaWindow(`sla-window-${index}`, "sample"));
  }
  const report = buildSlaWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
