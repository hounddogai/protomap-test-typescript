import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyActivationExceptionReport } from "./legacy-activation-exception-report.js";
import { LegacyActivationException, newLegacyActivationException } from "./legacy-activation-exception.js";

test("LegacyActivationExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_093_570);
  const items: LegacyActivationException[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyActivationException(`legacy-activation-exception-${index}`, "sample"));
  }
  const report = buildLegacyActivationExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
