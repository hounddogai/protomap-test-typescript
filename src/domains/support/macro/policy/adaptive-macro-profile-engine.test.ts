import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveMacroProfileEngine } from "./adaptive-macro-profile-engine.js";
import { newAdaptiveMacroProfile } from "./adaptive-macro-profile.js";

test("AdaptiveMacroProfileEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveMacroProfileEngine(flags.newRegistry());
  const item = newAdaptiveMacroProfile("code-40", "title-26");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
