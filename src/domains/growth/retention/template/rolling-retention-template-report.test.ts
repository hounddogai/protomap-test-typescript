import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingRetentionTemplateReport } from "./rolling-retention-template-report.js";
import { RollingRetentionTemplate, newRollingRetentionTemplate } from "./rolling-retention-template.js";

test("RollingRetentionTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_687_642);
  const items: RollingRetentionTemplate[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingRetentionTemplate(`rolling-retention-template-${index}`, "sample"));
  }
  const report = buildRollingRetentionTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
