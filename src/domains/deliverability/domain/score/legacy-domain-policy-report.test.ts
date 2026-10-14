import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyDomainPolicyReport } from "./legacy-domain-policy-report.js";
import { LegacyDomainPolicy, newLegacyDomainPolicy } from "./legacy-domain-policy.js";

test("LegacyDomainPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_900_539);
  const items: LegacyDomainPolicy[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLegacyDomainPolicy(`legacy-domain-policy-${index}`, "sample"));
  }
  const report = buildLegacyDomainPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
