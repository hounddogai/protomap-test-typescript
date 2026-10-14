import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalMentionDigestReport } from "./regional-mention-digest-report.js";
import { RegionalMentionDigest, newRegionalMentionDigest } from "./regional-mention-digest.js";

test("RegionalMentionDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_112_760);
  const items: RegionalMentionDigest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalMentionDigest(`regional-mention-digest-${index}`, "sample"));
  }
  const report = buildRegionalMentionDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
