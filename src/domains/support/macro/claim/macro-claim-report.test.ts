import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMacroClaimReport } from "./macro-claim-report.js";
import { MacroClaim, newMacroClaim } from "./macro-claim.js";

test("MacroClaimReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_711_627);
  const items: MacroClaim[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newMacroClaim(`macro-claim-${index}`, "sample"));
  }
  const report = buildMacroClaimReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
