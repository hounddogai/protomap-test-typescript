import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildScheduledDomainRequestReport } from "./scheduled-domain-request-report.js";
import { ScheduledDomainRequest, newScheduledDomainRequest } from "./scheduled-domain-request.js";

test("ScheduledDomainRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_510_364);
  const items: ScheduledDomainRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newScheduledDomainRequest(`scheduled-domain-request-${index}`, "sample"));
  }
  const report = buildScheduledDomainRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
