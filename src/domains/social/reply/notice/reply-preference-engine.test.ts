import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyPreferenceEngine } from "./reply-preference-engine.js";
import { newReplyPreference } from "./reply-preference.js";

test("ReplyPreferenceEngine keeps results within bounds", () => {
  const engine = defaultReplyPreferenceEngine(flags.newRegistry());
  const item = newReplyPreference("code-850", "title-77");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
