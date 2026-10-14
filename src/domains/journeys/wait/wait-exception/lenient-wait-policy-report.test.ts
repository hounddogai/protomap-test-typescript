import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientWaitPolicyReport } from "./lenient-wait-policy-report.js";
import { LenientWaitPolicy, newLenientWaitPolicy } from "./lenient-wait-policy.js";

test("LenientWaitPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_693_006);
  const items: LenientWaitPolicy[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientWaitPolicy(`lenient-wait-policy-${index}`, "sample"));
  }
  const report = buildLenientWaitPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
