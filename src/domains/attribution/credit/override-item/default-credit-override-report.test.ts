import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultCreditOverrideReport } from "./default-credit-override-report.js";
import { DefaultCreditOverride, newDefaultCreditOverride } from "./default-credit-override.js";

test("DefaultCreditOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_585_161);
  const items: DefaultCreditOverride[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultCreditOverride(`default-credit-override-${index}`, "sample"));
  }
  const report = buildDefaultCreditOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
