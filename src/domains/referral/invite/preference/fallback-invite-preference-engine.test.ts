import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackInvitePreferenceEngine } from "./fallback-invite-preference-engine.js";
import { newFallbackInvitePreference } from "./fallback-invite-preference.js";

test("FallbackInvitePreferenceEngine keeps results within bounds", () => {
  const engine = defaultFallbackInvitePreferenceEngine(flags.newRegistry());
  const item = newFallbackInvitePreference("code-213", "title-290");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
