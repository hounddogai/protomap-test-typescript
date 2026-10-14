import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualDomainScoreReport } from "./manual-domain-score-report.js";
import { ManualDomainScore, newManualDomainScore } from "./manual-domain-score.js";

test("ManualDomainScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_308_819);
  const items: ManualDomainScore[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualDomainScore(`manual-domain-score-${index}`, "sample"));
  }
  const report = buildManualDomainScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
