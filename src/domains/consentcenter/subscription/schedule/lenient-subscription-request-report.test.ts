import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientSubscriptionRequestReport } from "./lenient-subscription-request-report.js";
import { LenientSubscriptionRequest, newLenientSubscriptionRequest } from "./lenient-subscription-request.js";

test("LenientSubscriptionRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_734_253);
  const items: LenientSubscriptionRequest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientSubscriptionRequest(`lenient-subscription-request-${index}`, "sample"));
  }
  const report = buildLenientSubscriptionRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
