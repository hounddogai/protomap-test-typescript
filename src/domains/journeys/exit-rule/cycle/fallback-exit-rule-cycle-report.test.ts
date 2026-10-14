import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackExitRuleCycleReport } from "./fallback-exit-rule-cycle-report.js";
import { FallbackExitRuleCycle, newFallbackExitRuleCycle } from "./fallback-exit-rule-cycle.js";

test("FallbackExitRuleCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_021_972);
  const items: FallbackExitRuleCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFallbackExitRuleCycle(`fallback-exit-rule-cycle-${index}`, "sample"));
  }
  const report = buildFallbackExitRuleCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
