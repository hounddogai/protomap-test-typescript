import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitGroupReport } from "./wait-group-report.js";
import { WaitGroup, newWaitGroup } from "./wait-group.js";

test("WaitGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_398_497);
  const items: WaitGroup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWaitGroup(`wait-group-${index}`, "sample"));
  }
  const report = buildWaitGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
