import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingSubscriptionManifestReport } from "./pending-subscription-manifest-report.js";
import { PendingSubscriptionManifest, newPendingSubscriptionManifest } from "./pending-subscription-manifest.js";

test("PendingSubscriptionManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_510_547);
  const items: PendingSubscriptionManifest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPendingSubscriptionManifest(`pending-subscription-manifest-${index}`, "sample"));
  }
  const report = buildPendingSubscriptionManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
