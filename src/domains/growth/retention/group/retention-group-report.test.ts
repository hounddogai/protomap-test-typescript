import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRetentionGroupReport } from "./retention-group-report.js";
import { RetentionGroup, newRetentionGroup } from "./retention-group.js";

test("RetentionGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_711_828);
  const items: RetentionGroup[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRetentionGroup(`retention-group-${index}`, "sample"));
  }
  const report = buildRetentionGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
