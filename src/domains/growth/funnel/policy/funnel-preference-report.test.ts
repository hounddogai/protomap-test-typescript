import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFunnelPreferenceReport } from "./funnel-preference-report.js";
import { FunnelPreference, newFunnelPreference } from "./funnel-preference.js";

test("FunnelPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_164_760);
  const items: FunnelPreference[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newFunnelPreference(`funnel-preference-${index}`, "sample"));
  }
  const report = buildFunnelPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
