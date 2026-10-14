import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalPreferenceTierEngine } from "./global-preference-tier-engine.js";
import { newGlobalPreferenceTier } from "./global-preference-tier.js";

test("GlobalPreferenceTierEngine keeps results within bounds", () => {
  const engine = defaultGlobalPreferenceTierEngine(flags.newRegistry());
  const item = newGlobalPreferenceTier("code-309", "title-619");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
