import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientDomainScoreReport } from "./lenient-domain-score-report.js";
import { LenientDomainScore, newLenientDomainScore } from "./lenient-domain-score.js";

test("LenientDomainScoreReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_090_241);
  const items: LenientDomainScore[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientDomainScore(`lenient-domain-score-${index}`, "sample"));
  }
  const report = buildLenientDomainScoreReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
