import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionPreferenceEngine } from "./mention-preference-engine.js";
import { newMentionPreference } from "./mention-preference.js";

test("MentionPreferenceEngine keeps results within bounds", () => {
  const engine = defaultMentionPreferenceEngine(flags.newRegistry());
  const item = newMentionPreference("code-645", "name-242");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
