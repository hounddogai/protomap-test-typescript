import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictDeflectionOverrideReport } from "./strict-deflection-override-report.js";
import { StrictDeflectionOverride, newStrictDeflectionOverride } from "./strict-deflection-override.js";

test("StrictDeflectionOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_241_516);
  const items: StrictDeflectionOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictDeflectionOverride(`strict-deflection-override-${index}`, "sample"));
  }
  const report = buildStrictDeflectionOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
