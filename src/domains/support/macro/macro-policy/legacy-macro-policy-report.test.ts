import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyMacroPolicyReport } from "./legacy-macro-policy-report.js";
import { LegacyMacroPolicy, newLegacyMacroPolicy } from "./legacy-macro-policy.js";

test("LegacyMacroPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_903_955);
  const items: LegacyMacroPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyMacroPolicy(`legacy-macro-policy-${index}`, "sample"));
  }
  const report = buildLegacyMacroPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
