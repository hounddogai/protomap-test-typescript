import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathTargetReport } from "./path-target-report.js";
import { PathTarget, newPathTarget } from "./path-target.js";

test("PathTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_269_655);
  const items: PathTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPathTarget(`path-target-${index}`, "sample"));
  }
  const report = buildPathTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
