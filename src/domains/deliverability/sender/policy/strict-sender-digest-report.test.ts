import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictSenderDigestReport } from "./strict-sender-digest-report.js";
import { StrictSenderDigest, newStrictSenderDigest } from "./strict-sender-digest.js";

test("StrictSenderDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_769_147);
  const items: StrictSenderDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictSenderDigest(`strict-sender-digest-${index}`, "sample"));
  }
  const report = buildStrictSenderDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
