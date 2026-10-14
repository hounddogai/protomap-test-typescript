import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultDomainThresholdReport } from "./default-domain-threshold-report.js";
import { DefaultDomainThreshold, newDefaultDomainThreshold } from "./default-domain-threshold.js";

test("DefaultDomainThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_875_241);
  const items: DefaultDomainThreshold[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultDomainThreshold(`default-domain-threshold-${index}`, "sample"));
  }
  const report = buildDefaultDomainThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
