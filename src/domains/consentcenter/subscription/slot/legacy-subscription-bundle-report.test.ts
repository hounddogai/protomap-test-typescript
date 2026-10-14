import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacySubscriptionBundleReport } from "./legacy-subscription-bundle-report.js";
import { LegacySubscriptionBundle, newLegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

test("LegacySubscriptionBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_843_673);
  const items: LegacySubscriptionBundle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacySubscriptionBundle(`legacy-subscription-bundle-${index}`, "sample"));
  }
  const report = buildLegacySubscriptionBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
