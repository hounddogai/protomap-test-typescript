import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredJourneyDigestReport } from "./tiered-journey-digest-report.js";
import { TieredJourneyDigest, newTieredJourneyDigest } from "./tiered-journey-digest.js";

test("TieredJourneyDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_529_514);
  const items: TieredJourneyDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredJourneyDigest(`tiered-journey-digest-${index}`, "sample"));
  }
  const report = buildTieredJourneyDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
