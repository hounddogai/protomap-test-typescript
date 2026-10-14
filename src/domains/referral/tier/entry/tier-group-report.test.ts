import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierGroupReport } from "./tier-group-report.js";
import { TierGroup, newTierGroup } from "./tier-group.js";

test("TierGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_961_194);
  const items: TierGroup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTierGroup(`tier-group-${index}`, "sample"));
  }
  const report = buildTierGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
