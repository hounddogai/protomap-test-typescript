import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackSenderProfileEngine } from "./fallback-sender-profile-engine.js";
import { newFallbackSenderProfile } from "./fallback-sender-profile.js";

test("FallbackSenderProfileEngine keeps results within bounds", () => {
  const engine = defaultFallbackSenderProfileEngine(flags.newRegistry());
  const item = newFallbackSenderProfile("code-530", "label-720");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
