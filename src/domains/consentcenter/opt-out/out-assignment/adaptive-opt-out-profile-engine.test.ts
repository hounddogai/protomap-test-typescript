import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveOptOutProfileEngine } from "./adaptive-opt-out-profile-engine.js";
import { newAdaptiveOptOutProfile } from "./adaptive-opt-out-profile.js";

test("AdaptiveOptOutProfileEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveOptOutProfileEngine(flags.newRegistry());
  const item = newAdaptiveOptOutProfile("code-838", "name-878");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
