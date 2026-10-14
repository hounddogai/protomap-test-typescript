import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutTierReport } from "./opt-out-tier-report.js";
import { OptOutTier, newOptOutTier } from "./opt-out-tier.js";

test("OptOutTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_185_146);
  const items: OptOutTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newOptOutTier(`opt-out-tier-${index}`, "sample"));
  }
  const report = buildOptOutTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
