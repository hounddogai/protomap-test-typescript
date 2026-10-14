import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceAgreementReport } from "./bounce-agreement-report.js";
import { BounceAgreement, newBounceAgreement } from "./bounce-agreement.js";

test("BounceAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_567_413);
  const items: BounceAgreement[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBounceAgreement(`bounce-agreement-${index}`, "sample"));
  }
  const report = buildBounceAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
