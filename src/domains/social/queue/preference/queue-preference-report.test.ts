import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueuePreferenceReport } from "./queue-preference-report.js";
import { QueuePreference, newQueuePreference } from "./queue-preference.js";

test("QueuePreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_658_490);
  const items: QueuePreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newQueuePreference(`queue-preference-${index}`, "sample"));
  }
  const report = buildQueuePreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
