import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalMacroOverrideReport } from "./global-macro-override-report.js";
import { GlobalMacroOverride, newGlobalMacroOverride } from "./global-macro-override.js";

test("GlobalMacroOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_885_005);
  const items: GlobalMacroOverride[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalMacroOverride(`global-macro-override-${index}`, "sample"));
  }
  const report = buildGlobalMacroOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
