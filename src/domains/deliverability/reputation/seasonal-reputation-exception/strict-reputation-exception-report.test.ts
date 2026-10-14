import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictReputationExceptionReport } from "./strict-reputation-exception-report.js";
import { StrictReputationException, newStrictReputationException } from "./strict-reputation-exception.js";

test("StrictReputationExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_762_503);
  const items: StrictReputationException[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictReputationException(`strict-reputation-exception-${index}`, "sample"));
  }
  const report = buildStrictReputationExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
