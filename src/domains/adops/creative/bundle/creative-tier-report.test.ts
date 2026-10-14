import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeTierReport } from "./creative-tier-report.js";
import { CreativeTier, newCreativeTier } from "./creative-tier.js";

test("CreativeTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_231_793);
  const items: CreativeTier[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCreativeTier(`creative-tier-${index}`, "sample"));
  }
  const report = buildCreativeTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
