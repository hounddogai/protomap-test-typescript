import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptivePostDigestReport } from "./adaptive-post-digest-report.js";
import { AdaptivePostDigest, newAdaptivePostDigest } from "./adaptive-post-digest.js";

test("AdaptivePostDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_893_792);
  const items: AdaptivePostDigest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newAdaptivePostDigest(`adaptive-post-digest-${index}`, "sample"));
  }
  const report = buildAdaptivePostDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
