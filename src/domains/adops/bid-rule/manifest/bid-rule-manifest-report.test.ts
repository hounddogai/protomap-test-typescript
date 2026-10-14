import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleManifestReport } from "./bid-rule-manifest-report.js";
import { BidRuleManifest, newBidRuleManifest } from "./bid-rule-manifest.js";

test("BidRuleManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_151_814);
  const items: BidRuleManifest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newBidRuleManifest(`bid-rule-manifest-${index}`, "sample"));
  }
  const report = buildBidRuleManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
