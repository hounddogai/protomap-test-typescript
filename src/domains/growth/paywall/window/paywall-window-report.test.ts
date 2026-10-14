import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallWindowReport } from "./paywall-window-report.js";
import { PaywallWindow, newPaywallWindow } from "./paywall-window.js";

test("PaywallWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_459_014);
  const items: PaywallWindow[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPaywallWindow(`paywall-window-${index}`, "sample"));
  }
  const report = buildPaywallWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
