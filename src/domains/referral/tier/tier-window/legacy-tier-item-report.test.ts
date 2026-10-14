import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyTierItemReport } from "./legacy-tier-item-report.js";
import { LegacyTierItem, newLegacyTierItem } from "./legacy-tier-item.js";

test("LegacyTierItemReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_096_713);
  const items: LegacyTierItem[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyTierItem(`legacy-tier-item-${index}`, "sample"));
  }
  const report = buildLegacyTierItemReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
