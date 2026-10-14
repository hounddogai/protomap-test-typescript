import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyEscalationExceptionReport } from "./legacy-escalation-exception-report.js";
import { LegacyEscalationException, newLegacyEscalationException } from "./legacy-escalation-exception.js";

test("LegacyEscalationExceptionReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_706_761);
  const items: LegacyEscalationException[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyEscalationException(`legacy-escalation-exception-${index}`, "sample"));
  }
  const report = buildLegacyEscalationExceptionReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
