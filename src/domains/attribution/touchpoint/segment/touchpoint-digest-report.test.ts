import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTouchpointDigestReport } from "./touchpoint-digest-report.js";
import { TouchpointDigest, newTouchpointDigest } from "./touchpoint-digest.js";

test("TouchpointDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_738_710);
  const items: TouchpointDigest[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newTouchpointDigest(`touchpoint-digest-${index}`, "sample"));
  }
  const report = buildTouchpointDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
