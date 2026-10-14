import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFraudCheckGroupReport } from "./fraud-check-group-report.js";
import { FraudCheckGroup, newFraudCheckGroup } from "./fraud-check-group.js";

test("FraudCheckGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_101_721);
  const items: FraudCheckGroup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFraudCheckGroup(`fraud-check-group-${index}`, "sample"));
  }
  const report = buildFraudCheckGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
