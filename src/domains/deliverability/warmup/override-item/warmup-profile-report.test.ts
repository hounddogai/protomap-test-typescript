import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupProfileReport } from "./warmup-profile-report.js";
import { WarmupProfile, newWarmupProfile } from "./warmup-profile.js";

test("WarmupProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_799_778);
  const items: WarmupProfile[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWarmupProfile(`warmup-profile-${index}`, "sample"));
  }
  const report = buildWarmupProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
