import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalPaywallWindowReport } from "./regional-paywall-window-report.js";
import { RegionalPaywallWindow, newRegionalPaywallWindow } from "./regional-paywall-window.js";

test("RegionalPaywallWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_874_412);
  const items: RegionalPaywallWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRegionalPaywallWindow(`regional-paywall-window-${index}`, "sample"));
  }
  const report = buildRegionalPaywallWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
