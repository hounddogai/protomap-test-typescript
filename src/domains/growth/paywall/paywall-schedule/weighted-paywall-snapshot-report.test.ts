import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedPaywallSnapshotReport } from "./weighted-paywall-snapshot-report.js";
import { WeightedPaywallSnapshot, newWeightedPaywallSnapshot } from "./weighted-paywall-snapshot.js";

test("WeightedPaywallSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_442_540);
  const items: WeightedPaywallSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedPaywallSnapshot(`weighted-paywall-snapshot-${index}`, "sample"));
  }
  const report = buildWeightedPaywallSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
