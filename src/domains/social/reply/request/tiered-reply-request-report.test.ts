import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredReplyRequestReport } from "./tiered-reply-request-report.js";
import { TieredReplyRequest, newTieredReplyRequest } from "./tiered-reply-request.js";

test("TieredReplyRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_487_070);
  const items: TieredReplyRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredReplyRequest(`tiered-reply-request-${index}`, "sample"));
  }
  const report = buildTieredReplyRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
