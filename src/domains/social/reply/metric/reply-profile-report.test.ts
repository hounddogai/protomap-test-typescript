import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyProfileReport } from "./reply-profile-report.js";
import { ReplyProfile, newReplyProfile } from "./reply-profile.js";

test("ReplyProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_283_598);
  const items: ReplyProfile[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newReplyProfile(`reply-profile-${index}`, "sample"));
  }
  const report = buildReplyProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
