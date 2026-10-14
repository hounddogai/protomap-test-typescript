import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallManifestReport } from "./paywall-manifest-report.js";
import { PaywallManifest, newPaywallManifest } from "./paywall-manifest.js";

test("PaywallManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_715_917);
  const items: PaywallManifest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPaywallManifest(`paywall-manifest-${index}`, "sample"));
  }
  const report = buildPaywallManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
