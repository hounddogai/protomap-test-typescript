import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeTierEngine } from "./creative-tier-engine.js";
import { newCreativeTier } from "./creative-tier.js";

test("CreativeTierEngine keeps results within bounds", () => {
  const engine = defaultCreativeTierEngine(flags.newRegistry());
  const item = newCreativeTier("code-874", "name-811");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
