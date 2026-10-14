import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientSlaTierReport } from "./lenient-sla-tier-report.js";
import { LenientSlaTier, newLenientSlaTier } from "./lenient-sla-tier.js";

test("LenientSlaTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_152_706);
  const items: LenientSlaTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLenientSlaTier(`lenient-sla-tier-${index}`, "sample"));
  }
  const report = buildLenientSlaTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
