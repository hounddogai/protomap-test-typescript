import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedPostProfileReport } from "./capped-post-profile-report.js";
import { CappedPostProfile, newCappedPostProfile } from "./capped-post-profile.js";

test("CappedPostProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_885_679);
  const items: CappedPostProfile[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedPostProfile(`capped-post-profile-${index}`, "sample"));
  }
  const report = buildCappedPostProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
