import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyReplyDigestReport } from "./legacy-reply-digest-report.js";
import { LegacyReplyDigest, newLegacyReplyDigest } from "./legacy-reply-digest.js";

test("LegacyReplyDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_458_988);
  const items: LegacyReplyDigest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newLegacyReplyDigest(`legacy-reply-digest-${index}`, "sample"));
  }
  const report = buildLegacyReplyDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
