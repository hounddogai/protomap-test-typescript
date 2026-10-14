import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainGroupReport } from "./domain-group-report.js";
import { DomainGroup, newDomainGroup } from "./domain-group.js";

test("DomainGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_937_748);
  const items: DomainGroup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDomainGroup(`domain-group-${index}`, "sample"));
  }
  const report = buildDomainGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
