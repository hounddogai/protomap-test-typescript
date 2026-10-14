import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackSenderProfileReport } from "./fallback-sender-profile-report.js";
import { FallbackSenderProfile, newFallbackSenderProfile } from "./fallback-sender-profile.js";

test("FallbackSenderProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_572_449);
  const items: FallbackSenderProfile[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newFallbackSenderProfile(`fallback-sender-profile-${index}`, "sample"));
  }
  const report = buildFallbackSenderProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
