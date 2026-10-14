import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedBounceRecordReport } from "./capped-bounce-record-report.js";
import { CappedBounceRecord, newCappedBounceRecord } from "./capped-bounce-record.js";

test("CappedBounceRecordReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_051_163);
  const items: CappedBounceRecord[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedBounceRecord(`capped-bounce-record-${index}`, "sample"));
  }
  const report = buildCappedBounceRecordReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
