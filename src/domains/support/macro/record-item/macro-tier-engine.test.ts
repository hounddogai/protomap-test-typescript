import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroTierEngine } from "./macro-tier-engine.js";
import { newMacroTier } from "./macro-tier.js";

test("MacroTierEngine keeps results within bounds", () => {
  const engine = defaultMacroTierEngine(flags.newRegistry());
  const item = newMacroTier("code-187", "title-351");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
