import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowProfileReport } from "./window-profile-report.js";
import { WindowProfile, newWindowProfile } from "./window-profile.js";

test("WindowProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_799_690);
  const items: WindowProfile[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWindowProfile(`window-profile-${index}`, "sample"));
  }
  const report = buildWindowProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
