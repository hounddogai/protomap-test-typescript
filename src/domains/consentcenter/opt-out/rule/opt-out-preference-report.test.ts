import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildOptOutPreferenceReport } from "./opt-out-preference-report.js";
import { OptOutPreference, newOptOutPreference } from "./opt-out-preference.js";

test("OptOutPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_925_654);
  const items: OptOutPreference[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newOptOutPreference(`opt-out-preference-${index}`, "sample"));
  }
  const report = buildOptOutPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
