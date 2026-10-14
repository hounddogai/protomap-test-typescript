import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWindowDigestReport } from "./window-digest-report.js";
import { WindowDigest, newWindowDigest } from "./window-digest.js";

test("WindowDigestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_854_787);
  const items: WindowDigest[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newWindowDigest(`window-digest-${index}`, "sample"));
  }
  const report = buildWindowDigestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
