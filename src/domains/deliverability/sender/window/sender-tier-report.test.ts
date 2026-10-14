import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderTierReport } from "./sender-tier-report.js";
import { SenderTier, newSenderTier } from "./sender-tier.js";

test("SenderTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_012_892);
  const items: SenderTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSenderTier(`sender-tier-${index}`, "sample"));
  }
  const report = buildSenderTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
