import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveSubscriptionWindowReport } from "./adaptive-subscription-window-report.js";
import { AdaptiveSubscriptionWindow, newAdaptiveSubscriptionWindow } from "./adaptive-subscription-window.js";

test("AdaptiveSubscriptionWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_980_971);
  const items: AdaptiveSubscriptionWindow[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptiveSubscriptionWindow(`adaptive-subscription-window-${index}`, "sample"));
  }
  const report = buildAdaptiveSubscriptionWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
