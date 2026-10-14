import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyMappingReport } from "./reply-mapping-report.js";
import { ReplyMapping, newReplyMapping } from "./reply-mapping.js";

test("ReplyMappingReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_292_309);
  const items: ReplyMapping[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newReplyMapping(`reply-mapping-${index}`, "sample"));
  }
  const report = buildReplyMappingReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
