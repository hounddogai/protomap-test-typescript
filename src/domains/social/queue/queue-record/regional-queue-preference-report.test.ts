import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalQueuePreferenceReport } from "./regional-queue-preference-report.js";
import { RegionalQueuePreference, newRegionalQueuePreference } from "./regional-queue-preference.js";

test("RegionalQueuePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_961_967);
  const items: RegionalQueuePreference[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRegionalQueuePreference(`regional-queue-preference-${index}`, "sample"));
  }
  const report = buildRegionalQueuePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
