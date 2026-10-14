import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalPathPolicyReport } from "./regional-path-policy-report.js";
import { RegionalPathPolicy, newRegionalPathPolicy } from "./regional-path-policy.js";

test("RegionalPathPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_826_939);
  const items: RegionalPathPolicy[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRegionalPathPolicy(`regional-path-policy-${index}`, "sample"));
  }
  const report = buildRegionalPathPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
