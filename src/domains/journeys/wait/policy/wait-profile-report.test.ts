import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitProfileReport } from "./wait-profile-report.js";
import { WaitProfile, newWaitProfile } from "./wait-profile.js";

test("WaitProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_712_181);
  const items: WaitProfile[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWaitProfile(`wait-profile-${index}`, "sample"));
  }
  const report = buildWaitProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
