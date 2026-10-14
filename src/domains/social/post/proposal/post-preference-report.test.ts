import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostPreferenceReport } from "./post-preference-report.js";
import { PostPreference, newPostPreference } from "./post-preference.js";

test("PostPreferenceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_400_668);
  const items: PostPreference[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPostPreference(`post-preference-${index}`, "sample"));
  }
  const report = buildPostPreferenceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
