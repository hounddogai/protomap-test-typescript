import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPaywallWindowReport } from "./rolling-paywall-window-report.js";
import { RollingPaywallWindow, newRollingPaywallWindow } from "./rolling-paywall-window.js";

test("RollingPaywallWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_523_504);
  const items: RollingPaywallWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingPaywallWindow(`rolling-paywall-window-${index}`, "sample"));
  }
  const report = buildRollingPaywallWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
