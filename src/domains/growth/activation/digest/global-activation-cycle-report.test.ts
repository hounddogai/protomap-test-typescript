import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalActivationCycleReport } from "./global-activation-cycle-report.js";
import { GlobalActivationCycle, newGlobalActivationCycle } from "./global-activation-cycle.js";

test("GlobalActivationCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_637_774);
  const items: GlobalActivationCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalActivationCycle(`global-activation-cycle-${index}`, "sample"));
  }
  const report = buildGlobalActivationCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
