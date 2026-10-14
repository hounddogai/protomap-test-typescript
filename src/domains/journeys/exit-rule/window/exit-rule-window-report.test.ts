import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildExitRuleWindowReport } from "./exit-rule-window-report.js";
import { ExitRuleWindow, newExitRuleWindow } from "./exit-rule-window.js";

test("ExitRuleWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_173_644);
  const items: ExitRuleWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newExitRuleWindow(`exit-rule-window-${index}`, "sample"));
  }
  const report = buildExitRuleWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
