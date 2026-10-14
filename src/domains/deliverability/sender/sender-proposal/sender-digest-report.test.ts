import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderDigestReport } from "./sender-digest-report.js";
import { SenderDigest, newSenderDigest } from "./sender-digest.js";

test("SenderDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_084_067);
  const items: SenderDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newSenderDigest(`sender-digest-${index}`, "sample"));
  }
  const report = buildSenderDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
