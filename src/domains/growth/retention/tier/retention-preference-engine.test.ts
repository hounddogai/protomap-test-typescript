import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionPreferenceEngine } from "./retention-preference-engine.js";
import { newRetentionPreference } from "./retention-preference.js";

test("RetentionPreferenceEngine keeps results within bounds", () => {
  const engine = defaultRetentionPreferenceEngine(flags.newRegistry());
  const item = newRetentionPreference("code-985", "name-248");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
