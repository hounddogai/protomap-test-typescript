import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackBounceRollupEngine } from "./fallback-bounce-rollup-engine.js";
import { newFallbackBounceRollup } from "./fallback-bounce-rollup.js";

test("FallbackBounceRollupEngine keeps results within bounds", () => {
  const engine = defaultFallbackBounceRollupEngine(flags.newRegistry());
  const item = newFallbackBounceRollup("code-281", "name-998");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
