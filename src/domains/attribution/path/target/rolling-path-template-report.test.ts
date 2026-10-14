import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingPathTemplateReport } from "./rolling-path-template-report.js";
import { RollingPathTemplate, newRollingPathTemplate } from "./rolling-path-template.js";

test("RollingPathTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_266_682);
  const items: RollingPathTemplate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRollingPathTemplate(`rolling-path-template-${index}`, "sample"));
  }
  const report = buildRollingPathTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
