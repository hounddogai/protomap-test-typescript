import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedFlightGroupReport } from "./capped-flight-group-report.js";
import { CappedFlightGroup, newCappedFlightGroup } from "./capped-flight-group.js";

test("CappedFlightGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_670_168);
  const items: CappedFlightGroup[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedFlightGroup(`capped-flight-group-${index}`, "sample"));
  }
  const report = buildCappedFlightGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
