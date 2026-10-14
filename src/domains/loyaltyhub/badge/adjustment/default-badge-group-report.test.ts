import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultBadgeGroupReport } from "./default-badge-group-report.js";
import { DefaultBadgeGroup, newDefaultBadgeGroup } from "./default-badge-group.js";

test("DefaultBadgeGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_053_160);
  const items: DefaultBadgeGroup[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultBadgeGroup(`default-badge-group-${index}`, "sample"));
  }
  const report = buildDefaultBadgeGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
