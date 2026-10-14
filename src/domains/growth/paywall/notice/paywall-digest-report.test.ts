import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPaywallDigestReport } from "./paywall-digest-report.js";
import { PaywallDigest, newPaywallDigest } from "./paywall-digest.js";

test("PaywallDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_119_112);
  const items: PaywallDigest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPaywallDigest(`paywall-digest-${index}`, "sample"));
  }
  const report = buildPaywallDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
