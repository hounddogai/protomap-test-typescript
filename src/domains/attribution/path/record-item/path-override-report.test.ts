import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathOverrideReport } from "./path-override-report.js";
import { PathOverride, newPathOverride } from "./path-override.js";

test("PathOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_845_198);
  const items: PathOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPathOverride(`path-override-${index}`, "sample"));
  }
  const report = buildPathOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
