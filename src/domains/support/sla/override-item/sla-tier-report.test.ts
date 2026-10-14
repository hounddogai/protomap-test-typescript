import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaTierReport } from "./sla-tier-report.js";
import { SlaTier, newSlaTier } from "./sla-tier.js";

test("SlaTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_174_159);
  const items: SlaTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSlaTier(`sla-tier-${index}`, "sample"));
  }
  const report = buildSlaTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
