import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationOverrideReport } from "./activation-override-report.js";
import { ActivationOverride, newActivationOverride } from "./activation-override.js";

test("ActivationOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_474_252);
  const items: ActivationOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationOverride(`activation-override-${index}`, "sample"));
  }
  const report = buildActivationOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
