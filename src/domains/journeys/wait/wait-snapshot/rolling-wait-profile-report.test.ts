import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingWaitProfileReport } from "./rolling-wait-profile-report.js";
import { RollingWaitProfile, newRollingWaitProfile } from "./rolling-wait-profile.js";

test("RollingWaitProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_994_435);
  const items: RollingWaitProfile[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingWaitProfile(`rolling-wait-profile-${index}`, "sample"));
  }
  const report = buildRollingWaitProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
