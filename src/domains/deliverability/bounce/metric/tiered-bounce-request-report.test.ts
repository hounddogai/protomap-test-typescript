import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBounceRequestReport } from "./tiered-bounce-request-report.js";
import { TieredBounceRequest, newTieredBounceRequest } from "./tiered-bounce-request.js";

test("TieredBounceRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_747_180);
  const items: TieredBounceRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newTieredBounceRequest(`tiered-bounce-request-${index}`, "sample"));
  }
  const report = buildTieredBounceRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
