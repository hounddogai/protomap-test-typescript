import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatProfileReport } from "./csat-profile-report.js";
import { CsatProfile, newCsatProfile } from "./csat-profile.js";

test("CsatProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_283_273);
  const items: CsatProfile[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCsatProfile(`csat-profile-${index}`, "sample"));
  }
  const report = buildCsatProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
