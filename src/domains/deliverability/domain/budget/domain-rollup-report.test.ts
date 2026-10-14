import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainRollupReport } from "./domain-rollup-report.js";
import { DomainRollup, newDomainRollup } from "./domain-rollup.js";

test("DomainRollupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_918_709);
  const items: DomainRollup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDomainRollup(`domain-rollup-${index}`, "sample"));
  }
  const report = buildDomainRollupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
