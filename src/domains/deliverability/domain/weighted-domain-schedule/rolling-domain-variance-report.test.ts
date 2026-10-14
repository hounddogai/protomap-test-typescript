import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingDomainVarianceReport } from "./rolling-domain-variance-report.js";
import { RollingDomainVariance, newRollingDomainVariance } from "./rolling-domain-variance.js";

test("RollingDomainVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_933_322);
  const items: RollingDomainVariance[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRollingDomainVariance(`rolling-domain-variance-${index}`, "sample"));
  }
  const report = buildRollingDomainVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
