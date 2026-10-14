import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledDomainGroupReport } from "./scheduled-domain-group-report.js";
import { ScheduledDomainGroup, newScheduledDomainGroup } from "./scheduled-domain-group.js";

test("ScheduledDomainGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_437_283);
  const items: ScheduledDomainGroup[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledDomainGroup(`scheduled-domain-group-${index}`, "sample"));
  }
  const report = buildScheduledDomainGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
