import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyEntryEngine } from "./reply-entry-engine.js";
import { newReplyEntry } from "./reply-entry.js";

test("ReplyEntryEngine keeps results within bounds", () => {
  const engine = defaultReplyEntryEngine();
  const item = newReplyEntry("code-512", "label-871");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
