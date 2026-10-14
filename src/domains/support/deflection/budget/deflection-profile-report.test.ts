import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionProfileReport } from "./deflection-profile-report.js";
import { DeflectionProfile, newDeflectionProfile } from "./deflection-profile.js";

test("DeflectionProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_243_843);
  const items: DeflectionProfile[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDeflectionProfile(`deflection-profile-${index}`, "sample"));
  }
  const report = buildDeflectionProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
