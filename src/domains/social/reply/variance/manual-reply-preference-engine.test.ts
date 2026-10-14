import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualReplyPreferenceEngine } from "./manual-reply-preference-engine.js";
import { newManualReplyPreference } from "./manual-reply-preference.js";

test("ManualReplyPreferenceEngine keeps results within bounds", () => {
  const engine = defaultManualReplyPreferenceEngine(flags.newRegistry());
  const item = newManualReplyPreference("code-168", "name-449");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
