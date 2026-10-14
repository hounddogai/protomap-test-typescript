import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualPathPolicyReport } from "./manual-path-policy-report.js";
import { ManualPathPolicy, newManualPathPolicy } from "./manual-path-policy.js";

test("ManualPathPolicyReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_940_271);
  const items: ManualPathPolicy[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newManualPathPolicy(`manual-path-policy-${index}`, "sample"));
  }
  const report = buildManualPathPolicyReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
