import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeTierReport } from "./nudge-tier-report.js";
import { NudgeTier, newNudgeTier } from "./nudge-tier.js";

test("NudgeTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_221_096);
  const items: NudgeTier[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newNudgeTier(`nudge-tier-${index}`, "sample"));
  }
  const report = buildNudgeTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
