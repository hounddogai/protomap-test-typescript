import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredReplyPreferenceEngine } from "./tiered-reply-preference-engine.js";
import { newTieredReplyPreference } from "./tiered-reply-preference.js";

test("TieredReplyPreferenceEngine keeps results within bounds", () => {
  const engine = defaultTieredReplyPreferenceEngine(flags.newRegistry());
  const item = newTieredReplyPreference("code-910", "name-453");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
