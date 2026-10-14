import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientReplyEntryReport } from "./lenient-reply-entry-report.js";
import { LenientReplyEntry, newLenientReplyEntry } from "./lenient-reply-entry.js";

test("LenientReplyEntryReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_072_267);
  const items: LenientReplyEntry[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLenientReplyEntry(`lenient-reply-entry-${index}`, "sample"));
  }
  const report = buildLenientReplyEntryReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
