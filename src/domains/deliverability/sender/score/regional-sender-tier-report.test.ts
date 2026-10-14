import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalSenderTierReport } from "./regional-sender-tier-report.js";
import { RegionalSenderTier, newRegionalSenderTier } from "./regional-sender-tier.js";

test("RegionalSenderTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_534_763);
  const items: RegionalSenderTier[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalSenderTier(`regional-sender-tier-${index}`, "sample"));
  }
  const report = buildRegionalSenderTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
