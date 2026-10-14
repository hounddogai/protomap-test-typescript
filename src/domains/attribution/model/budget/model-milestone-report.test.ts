import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelMilestoneReport } from "./model-milestone-report.js";
import { ModelMilestone, newModelMilestone } from "./model-milestone.js";

test("ModelMilestoneReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_815_481);
  const items: ModelMilestone[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newModelMilestone(`model-milestone-${index}`, "sample"));
  }
  const report = buildModelMilestoneReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
