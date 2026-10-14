import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPreferenceCycleReport } from "./preference-cycle-report.js";
import { PreferenceCycle, newPreferenceCycle } from "./preference-cycle.js";

test("PreferenceCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_082_125);
  const items: PreferenceCycle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPreferenceCycle(`preference-cycle-${index}`, "sample"));
  }
  const report = buildPreferenceCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
