import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedDomainThresholdReport } from "./capped-domain-threshold-report.js";
import { CappedDomainThreshold, newCappedDomainThreshold } from "./capped-domain-threshold.js";

test("CappedDomainThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_399_875);
  const items: CappedDomainThreshold[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedDomainThreshold(`capped-domain-threshold-${index}`, "sample"));
  }
  const report = buildCappedDomainThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
