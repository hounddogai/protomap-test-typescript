import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryMacroPolicyReport } from "./primary-macro-policy-report.js";
import { PrimaryMacroPolicy, newPrimaryMacroPolicy } from "./primary-macro-policy.js";

test("PrimaryMacroPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_736_613);
  const items: PrimaryMacroPolicy[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPrimaryMacroPolicy(`primary-macro-policy-${index}`, "sample"));
  }
  const report = buildPrimaryMacroPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
