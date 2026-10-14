import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWarmupEntryReport } from "./warmup-entry-report.js";
import { WarmupEntry, newWarmupEntry } from "./warmup-entry.js";

test("WarmupEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_140_786);
  const items: WarmupEntry[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWarmupEntry(`warmup-entry-${index}`, "sample"));
  }
  const report = buildWarmupEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
