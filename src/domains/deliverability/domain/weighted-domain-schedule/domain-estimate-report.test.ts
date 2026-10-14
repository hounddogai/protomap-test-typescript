import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainEstimateReport } from "./domain-estimate-report.js";
import { DomainEstimate, newDomainEstimate } from "./domain-estimate.js";

test("DomainEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_960_307);
  const items: DomainEstimate[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDomainEstimate(`domain-estimate-${index}`, "sample"));
  }
  const report = buildDomainEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
