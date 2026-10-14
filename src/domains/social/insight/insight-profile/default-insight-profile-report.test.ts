import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultInsightProfileReport } from "./default-insight-profile-report.js";
import { DefaultInsightProfile, newDefaultInsightProfile } from "./default-insight-profile.js";

test("DefaultInsightProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_998_563);
  const items: DefaultInsightProfile[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultInsightProfile(`default-insight-profile-${index}`, "sample"));
  }
  const report = buildDefaultInsightProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
