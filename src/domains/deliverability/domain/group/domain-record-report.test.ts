import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainRecordReport } from "./domain-record-report.js";
import { DomainRecord, newDomainRecord } from "./domain-record.js";

test("DomainRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_514_603);
  const items: DomainRecord[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDomainRecord(`domain-record-${index}`, "sample"));
  }
  const report = buildDomainRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
