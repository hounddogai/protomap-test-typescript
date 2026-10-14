import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientActivationOverrideReport } from "./lenient-activation-override-report.js";
import { LenientActivationOverride, newLenientActivationOverride } from "./lenient-activation-override.js";

test("LenientActivationOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_356_016);
  const items: LenientActivationOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientActivationOverride(`lenient-activation-override-${index}`, "sample"));
  }
  const report = buildLenientActivationOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
