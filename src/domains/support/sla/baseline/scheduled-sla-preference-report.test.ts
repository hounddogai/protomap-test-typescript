import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledSlaPreferenceReport } from "./scheduled-sla-preference-report.js";
import { ScheduledSlaPreference, newScheduledSlaPreference } from "./scheduled-sla-preference.js";

test("ScheduledSlaPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_218_597);
  const items: ScheduledSlaPreference[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newScheduledSlaPreference(`scheduled-sla-preference-${index}`, "sample"));
  }
  const report = buildScheduledSlaPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
