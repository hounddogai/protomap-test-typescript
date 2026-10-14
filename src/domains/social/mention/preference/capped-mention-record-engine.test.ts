import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedMentionRecordEngine } from "./capped-mention-record-engine.js";
import { newCappedMentionRecord } from "./capped-mention-record.js";

test("CappedMentionRecordEngine keeps results within bounds", () => {
  const engine = defaultCappedMentionRecordEngine(flags.newRegistry());
  const item = newCappedMentionRecord("code-130", "label-316");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
