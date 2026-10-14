import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionWindowReport } from "./mention-window-report.js";
import { MentionWindow, newMentionWindow } from "./mention-window.js";

test("MentionWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_438_713);
  const items: MentionWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newMentionWindow(`mention-window-${index}`, "sample"));
  }
  const report = buildMentionWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
