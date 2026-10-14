import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedSenderProfileReport } from "./capped-sender-profile-report.js";
import { CappedSenderProfile, newCappedSenderProfile } from "./capped-sender-profile.js";

test("CappedSenderProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_382_635);
  const items: CappedSenderProfile[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedSenderProfile(`capped-sender-profile-${index}`, "sample"));
  }
  const report = buildCappedSenderProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
