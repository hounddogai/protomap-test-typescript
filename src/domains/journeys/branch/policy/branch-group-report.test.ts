import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBranchGroupReport } from "./branch-group-report.js";
import { BranchGroup, newBranchGroup } from "./branch-group.js";

test("BranchGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_767_486);
  const items: BranchGroup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBranchGroup(`branch-group-${index}`, "sample"));
  }
  const report = buildBranchGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
