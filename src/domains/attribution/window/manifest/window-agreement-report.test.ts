import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowAgreementReport } from "./window-agreement-report.js";
import { WindowAgreement, newWindowAgreement } from "./window-agreement.js";

test("WindowAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_769_203);
  const items: WindowAgreement[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWindowAgreement(`window-agreement-${index}`, "sample"));
  }
  const report = buildWindowAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
