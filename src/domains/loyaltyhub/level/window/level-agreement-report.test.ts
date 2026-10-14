import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLevelAgreementReport } from "./level-agreement-report.js";
import { LevelAgreement, newLevelAgreement } from "./level-agreement.js";

test("LevelAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_149_952);
  const items: LevelAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLevelAgreement(`level-agreement-${index}`, "sample"));
  }
  const report = buildLevelAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
