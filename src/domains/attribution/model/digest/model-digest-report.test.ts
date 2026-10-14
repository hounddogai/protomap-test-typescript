import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildModelDigestReport } from "./model-digest-report.js";
import { ModelDigest, newModelDigest } from "./model-digest.js";

test("ModelDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_939_995);
  const items: ModelDigest[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newModelDigest(`model-digest-${index}`, "sample"));
  }
  const report = buildModelDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
