import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultModelTierReport } from "./default-model-tier-report.js";
import { DefaultModelTier, newDefaultModelTier } from "./default-model-tier.js";

test("DefaultModelTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_058_708);
  const items: DefaultModelTier[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDefaultModelTier(`default-model-tier-${index}`, "sample"));
  }
  const report = buildDefaultModelTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
