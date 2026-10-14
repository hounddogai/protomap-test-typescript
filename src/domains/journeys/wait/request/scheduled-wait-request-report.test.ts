import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledWaitRequestReport } from "./scheduled-wait-request-report.js";
import { ScheduledWaitRequest, newScheduledWaitRequest } from "./scheduled-wait-request.js";

test("ScheduledWaitRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_917_161);
  const items: ScheduledWaitRequest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newScheduledWaitRequest(`scheduled-wait-request-${index}`, "sample"));
  }
  const report = buildScheduledWaitRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
