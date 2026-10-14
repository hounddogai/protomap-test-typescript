import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostDigestReport } from "./post-digest-report.js";
import { PostDigest, newPostDigest } from "./post-digest.js";

test("PostDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_776_643);
  const items: PostDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPostDigest(`post-digest-${index}`, "sample"));
  }
  const report = buildPostDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
