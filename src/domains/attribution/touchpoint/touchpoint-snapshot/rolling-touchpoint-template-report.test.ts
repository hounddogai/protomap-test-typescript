import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingTouchpointTemplateReport } from "./rolling-touchpoint-template-report.js";
import { RollingTouchpointTemplate, newRollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

test("RollingTouchpointTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_268_133);
  const items: RollingTouchpointTemplate[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newRollingTouchpointTemplate(`rolling-touchpoint-template-${index}`, "sample"));
  }
  const report = buildRollingTouchpointTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
