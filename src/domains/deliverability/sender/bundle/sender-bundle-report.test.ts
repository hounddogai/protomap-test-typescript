import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderBundleReport } from "./sender-bundle-report.js";
import { SenderBundle, newSenderBundle } from "./sender-bundle.js";

test("SenderBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_652_734);
  const items: SenderBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newSenderBundle(`sender-bundle-${index}`, "sample"));
  }
  const report = buildSenderBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
