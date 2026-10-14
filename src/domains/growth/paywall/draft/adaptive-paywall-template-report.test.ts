import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptivePaywallTemplateReport } from "./adaptive-paywall-template-report.js";
import { AdaptivePaywallTemplate, newAdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

test("AdaptivePaywallTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_605_539);
  const items: AdaptivePaywallTemplate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptivePaywallTemplate(`adaptive-paywall-template-${index}`, "sample"));
  }
  const report = buildAdaptivePaywallTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
