import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedMentionDigestReport } from "./capped-mention-digest-report.js";
import { CappedMentionDigest, newCappedMentionDigest } from "./capped-mention-digest.js";

test("CappedMentionDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_207_236);
  const items: CappedMentionDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedMentionDigest(`capped-mention-digest-${index}`, "sample"));
  }
  const report = buildCappedMentionDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
