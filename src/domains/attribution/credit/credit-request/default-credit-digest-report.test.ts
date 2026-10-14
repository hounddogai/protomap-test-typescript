import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultCreditDigestReport } from "./default-credit-digest-report.js";
import { DefaultCreditDigest, newDefaultCreditDigest } from "./default-credit-digest.js";

test("DefaultCreditDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_885_177);
  const items: DefaultCreditDigest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newDefaultCreditDigest(`default-credit-digest-${index}`, "sample"));
  }
  const report = buildDefaultCreditDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
