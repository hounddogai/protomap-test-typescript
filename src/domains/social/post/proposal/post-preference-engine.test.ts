import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostPreferenceEngine } from "./post-preference-engine.js";
import { newPostPreference } from "./post-preference.js";

test("PostPreferenceEngine keeps results within bounds", () => {
  const engine = defaultPostPreferenceEngine(flags.newRegistry());
  const item = newPostPreference("code-126", "name-810");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
