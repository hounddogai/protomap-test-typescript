import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryPaywallBaselineReport } from "./primary-paywall-baseline-report.js";
import { PrimaryPaywallBaseline, newPrimaryPaywallBaseline } from "./primary-paywall-baseline.js";

test("PrimaryPaywallBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_387_662);
  const items: PrimaryPaywallBaseline[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPrimaryPaywallBaseline(`primary-paywall-baseline-${index}`, "sample"));
  }
  const report = buildPrimaryPaywallBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
