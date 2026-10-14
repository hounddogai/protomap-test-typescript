import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedDeflectionAssignmentReport } from "./weighted-deflection-assignment-report.js";
import { WeightedDeflectionAssignment, newWeightedDeflectionAssignment } from "./weighted-deflection-assignment.js";

test("WeightedDeflectionAssignmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_224_272);
  const items: WeightedDeflectionAssignment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedDeflectionAssignment(`weighted-deflection-assignment-${index}`, "sample"));
  }
  const report = buildWeightedDeflectionAssignmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
