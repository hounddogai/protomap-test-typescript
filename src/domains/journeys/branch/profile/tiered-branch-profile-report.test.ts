import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredBranchProfileReport } from "./tiered-branch-profile-report.js";
import { TieredBranchProfile, newTieredBranchProfile } from "./tiered-branch-profile.js";

test("TieredBranchProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_891_733);
  const items: TieredBranchProfile[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTieredBranchProfile(`tiered-branch-profile-${index}`, "sample"));
  }
  const report = buildTieredBranchProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
