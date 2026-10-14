import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildChallengeTemplateReport } from "./challenge-template-report.js";
import { ChallengeTemplate, newChallengeTemplate } from "./challenge-template.js";

test("ChallengeTemplateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_395_422);
  const items: ChallengeTemplate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newChallengeTemplate(`challenge-template-${index}`, "sample"));
  }
  const report = buildChallengeTemplateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
