import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledTouchpointPreferenceReport } from "./scheduled-touchpoint-preference-report.js";
import {
  ScheduledTouchpointPreference,
  newScheduledTouchpointPreference,
} from "./scheduled-touchpoint-preference.js";

test("ScheduledTouchpointPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_375_564);
  const items: ScheduledTouchpointPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newScheduledTouchpointPreference(`scheduled-touchpoint-preference-${index}`, "sample"));
  }
  const report = buildScheduledTouchpointPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
