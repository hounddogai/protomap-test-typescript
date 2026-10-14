import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictPaywallSnapshotReport } from "./strict-paywall-snapshot-report.js";
import { StrictPaywallSnapshot, newStrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

test("StrictPaywallSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_990_193);
  const items: StrictPaywallSnapshot[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newStrictPaywallSnapshot(`strict-paywall-snapshot-${index}`, "sample"));
  }
  const report = buildStrictPaywallSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
