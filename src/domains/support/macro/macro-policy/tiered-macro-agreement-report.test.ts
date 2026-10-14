import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredMacroAgreementReport } from "./tiered-macro-agreement-report.js";
import { TieredMacroAgreement, newTieredMacroAgreement } from "./tiered-macro-agreement.js";

test("TieredMacroAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_227_197);
  const items: TieredMacroAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredMacroAgreement(`tiered-macro-agreement-${index}`, "sample"));
  }
  const report = buildTieredMacroAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
