import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitExceptionReport } from "./wait-exception-report.js";
import { WaitException, newWaitException } from "./wait-exception.js";

test("WaitExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_584_296);
  const items: WaitException[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWaitException(`wait-exception-${index}`, "sample"));
  }
  const report = buildWaitExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
