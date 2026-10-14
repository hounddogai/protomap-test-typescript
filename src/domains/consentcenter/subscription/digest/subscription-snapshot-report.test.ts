import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSubscriptionSnapshotReport } from "./subscription-snapshot-report.js";
import { SubscriptionSnapshot, newSubscriptionSnapshot } from "./subscription-snapshot.js";

test("SubscriptionSnapshotReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_583_461);
  const items: SubscriptionSnapshot[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSubscriptionSnapshot(`subscription-snapshot-${index}`, "sample"));
  }
  const report = buildSubscriptionSnapshotReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
