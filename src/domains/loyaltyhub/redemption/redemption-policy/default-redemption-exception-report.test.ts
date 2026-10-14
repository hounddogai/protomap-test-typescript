import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultRedemptionExceptionReport } from "./default-redemption-exception-report.js";
import { DefaultRedemptionException, newDefaultRedemptionException } from "./default-redemption-exception.js";

test("DefaultRedemptionExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_648_467);
  const items: DefaultRedemptionException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultRedemptionException(`default-redemption-exception-${index}`, "sample"));
  }
  const report = buildDefaultRedemptionExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
