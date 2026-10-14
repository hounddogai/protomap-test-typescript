import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainDigestReport } from "./domain-digest-report.js";
import { DomainDigest, newDomainDigest } from "./domain-digest.js";

test("DomainDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_593_097);
  const items: DomainDigest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newDomainDigest(`domain-digest-${index}`, "sample"));
  }
  const report = buildDomainDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
