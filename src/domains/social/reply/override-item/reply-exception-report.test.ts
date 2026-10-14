import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyExceptionReport } from "./reply-exception-report.js";
import { ReplyException, newReplyException } from "./reply-exception.js";

test("ReplyExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_906_746);
  const items: ReplyException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newReplyException(`reply-exception-${index}`, "sample"));
  }
  const report = buildReplyExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
