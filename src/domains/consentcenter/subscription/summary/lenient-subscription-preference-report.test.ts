import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientSubscriptionPreferenceReport } from "./lenient-subscription-preference-report.js";
import {
  LenientSubscriptionPreference,
  newLenientSubscriptionPreference,
} from "./lenient-subscription-preference.js";

test("LenientSubscriptionPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_949_619);
  const items: LenientSubscriptionPreference[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientSubscriptionPreference(`lenient-subscription-preference-${index}`, "sample"));
  }
  const report = buildLenientSubscriptionPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
