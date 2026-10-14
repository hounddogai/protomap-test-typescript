import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientBranchAgreementReport } from "./lenient-branch-agreement-report.js";
import { LenientBranchAgreement, newLenientBranchAgreement } from "./lenient-branch-agreement.js";

test("LenientBranchAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_255_862);
  const items: LenientBranchAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientBranchAgreement(`lenient-branch-agreement-${index}`, "sample"));
  }
  const report = buildLenientBranchAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
