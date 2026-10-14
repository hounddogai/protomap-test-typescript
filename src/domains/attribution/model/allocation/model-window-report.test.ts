import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelWindowReport } from "./model-window-report.js";
import { ModelWindow, newModelWindow } from "./model-window.js";

test("ModelWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_622_044);
  const items: ModelWindow[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newModelWindow(`model-window-${index}`, "sample"));
  }
  const report = buildModelWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
