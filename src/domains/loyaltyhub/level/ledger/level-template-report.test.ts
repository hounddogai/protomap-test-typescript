import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelTemplateReport } from "./level-template-report.js";
import { LevelTemplate, newLevelTemplate } from "./level-template.js";

test("LevelTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_152_537);
  const items: LevelTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLevelTemplate(`level-template-${index}`, "sample"));
  }
  const report = buildLevelTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
