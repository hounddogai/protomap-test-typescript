import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalDeflectionBaselineReport } from "./global-deflection-baseline-report.js";
import { GlobalDeflectionBaseline, newGlobalDeflectionBaseline } from "./global-deflection-baseline.js";

test("GlobalDeflectionBaselineReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_596_844);
  const items: GlobalDeflectionBaseline[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newGlobalDeflectionBaseline(`global-deflection-baseline-${index}`, "sample"));
  }
  const report = buildGlobalDeflectionBaselineReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
