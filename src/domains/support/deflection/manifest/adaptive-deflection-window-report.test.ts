import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveDeflectionWindowReport } from "./adaptive-deflection-window-report.js";
import { AdaptiveDeflectionWindow, newAdaptiveDeflectionWindow } from "./adaptive-deflection-window.js";

test("AdaptiveDeflectionWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_714_032);
  const items: AdaptiveDeflectionWindow[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newAdaptiveDeflectionWindow(`adaptive-deflection-window-${index}`, "sample"));
  }
  const report = buildAdaptiveDeflectionWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
