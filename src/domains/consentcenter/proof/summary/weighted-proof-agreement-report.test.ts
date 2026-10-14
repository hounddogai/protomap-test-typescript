import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedProofAgreementReport } from "./weighted-proof-agreement-report.js";
import { WeightedProofAgreement, newWeightedProofAgreement } from "./weighted-proof-agreement.js";

test("WeightedProofAgreementReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_919_976);
  const items: WeightedProofAgreement[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedProofAgreement(`weighted-proof-agreement-${index}`, "sample"));
  }
  const report = buildWeightedProofAgreementReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
