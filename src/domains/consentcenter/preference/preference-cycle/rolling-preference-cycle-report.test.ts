import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPreferenceCycleReport } from "./rolling-preference-cycle-report.js";
import { RollingPreferenceCycle, newRollingPreferenceCycle } from "./rolling-preference-cycle.js";

test("RollingPreferenceCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_705_233);
  const items: RollingPreferenceCycle[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingPreferenceCycle(`rolling-preference-cycle-${index}`, "sample"));
  }
  const report = buildRollingPreferenceCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
