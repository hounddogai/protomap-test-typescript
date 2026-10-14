import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceCycleReport } from "./bounce-cycle-report.js";
import { BounceCycle, newBounceCycle } from "./bounce-cycle.js";

test("BounceCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_561_132);
  const items: BounceCycle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBounceCycle(`bounce-cycle-${index}`, "sample"));
  }
  const report = buildBounceCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
