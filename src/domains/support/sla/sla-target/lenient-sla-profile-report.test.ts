import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientSlaProfileReport } from "./lenient-sla-profile-report.js";
import { LenientSlaProfile, newLenientSlaProfile } from "./lenient-sla-profile.js";

test("LenientSlaProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_548_150);
  const items: LenientSlaProfile[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientSlaProfile(`lenient-sla-profile-${index}`, "sample"));
  }
  const report = buildLenientSlaProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
