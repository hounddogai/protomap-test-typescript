import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceTierReport } from "./preference-tier-report.js";
import { PreferenceTier, newPreferenceTier } from "./preference-tier.js";

test("PreferenceTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_540_408);
  const items: PreferenceTier[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPreferenceTier(`preference-tier-${index}`, "sample"));
  }
  const report = buildPreferenceTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
