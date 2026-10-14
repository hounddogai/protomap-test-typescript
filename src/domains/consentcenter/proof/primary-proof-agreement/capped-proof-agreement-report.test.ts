import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedProofAgreementReport } from "./capped-proof-agreement-report.js";
import { CappedProofAgreement, newCappedProofAgreement } from "./capped-proof-agreement.js";

test("CappedProofAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_161_600);
  const items: CappedProofAgreement[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedProofAgreement(`capped-proof-agreement-${index}`, "sample"));
  }
  const report = buildCappedProofAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
