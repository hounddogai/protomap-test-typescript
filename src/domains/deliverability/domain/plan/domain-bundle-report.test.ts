import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDomainBundleReport } from "./domain-bundle-report.js";
import { DomainBundle, newDomainBundle } from "./domain-bundle.js";

test("DomainBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_398_030);
  const items: DomainBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newDomainBundle(`domain-bundle-${index}`, "sample"));
  }
  const report = buildDomainBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
