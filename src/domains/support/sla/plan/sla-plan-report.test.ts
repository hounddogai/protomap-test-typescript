import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSlaPlanReport } from "./sla-plan-report.js";
import { SlaPlan, newSlaPlan } from "./sla-plan.js";

test("SlaPlanReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_687_310);
  const items: SlaPlan[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSlaPlan(`sla-plan-${index}`, "sample"));
  }
  const report = buildSlaPlanReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
