import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientDomainRequestReport } from "./lenient-domain-request-report.js";
import { LenientDomainRequest, newLenientDomainRequest } from "./lenient-domain-request.js";

test("LenientDomainRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_142_079);
  const items: LenientDomainRequest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientDomainRequest(`lenient-domain-request-${index}`, "sample"));
  }
  const report = buildLenientDomainRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
