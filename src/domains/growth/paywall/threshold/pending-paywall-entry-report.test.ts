import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingPaywallEntryReport } from "./pending-paywall-entry-report.js";
import { PendingPaywallEntry, newPendingPaywallEntry } from "./pending-paywall-entry.js";

test("PendingPaywallEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_438_055);
  const items: PendingPaywallEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingPaywallEntry(`pending-paywall-entry-${index}`, "sample"));
  }
  const report = buildPendingPaywallEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
