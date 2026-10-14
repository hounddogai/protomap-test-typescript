import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalBranchPolicyReport } from "./global-branch-policy-report.js";
import { GlobalBranchPolicy, newGlobalBranchPolicy } from "./global-branch-policy.js";

test("GlobalBranchPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_877_895);
  const items: GlobalBranchPolicy[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalBranchPolicy(`global-branch-policy-${index}`, "sample"));
  }
  const report = buildGlobalBranchPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
