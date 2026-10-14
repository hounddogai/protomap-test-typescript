import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientBidRuleManifestReport } from "./lenient-bid-rule-manifest-report.js";
import { LenientBidRuleManifest, newLenientBidRuleManifest } from "./lenient-bid-rule-manifest.js";

test("LenientBidRuleManifestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_971_873);
  const items: LenientBidRuleManifest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientBidRuleManifest(`lenient-bid-rule-manifest-${index}`, "sample"));
  }
  const report = buildLenientBidRuleManifestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
