import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedMentionPreferenceReport } from "./capped-mention-preference-report.js";
import { CappedMentionPreference, newCappedMentionPreference } from "./capped-mention-preference.js";

test("CappedMentionPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_463_668);
  const items: CappedMentionPreference[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedMentionPreference(`capped-mention-preference-${index}`, "sample"));
  }
  const report = buildCappedMentionPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
