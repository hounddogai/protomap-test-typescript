import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryPaywallCycleReport } from "./primary-paywall-cycle-report.js";
import { PrimaryPaywallCycle, newPrimaryPaywallCycle } from "./primary-paywall-cycle.js";

test("PrimaryPaywallCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_503_152);
  const items: PrimaryPaywallCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryPaywallCycle(`primary-paywall-cycle-${index}`, "sample"));
  }
  const report = buildPrimaryPaywallCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
