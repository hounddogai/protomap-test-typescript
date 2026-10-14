import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalSlaPreferenceReport } from "./global-sla-preference-report.js";
import { GlobalSlaPreference, newGlobalSlaPreference } from "./global-sla-preference.js";

test("GlobalSlaPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_513_155);
  const items: GlobalSlaPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newGlobalSlaPreference(`global-sla-preference-${index}`, "sample"));
  }
  const report = buildGlobalSlaPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
