import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaTierEngine } from "./sla-tier-engine.js";
import { newSlaTier } from "./sla-tier.js";

test("SlaTierEngine keeps results within bounds", () => {
  const engine = defaultSlaTierEngine(flags.newRegistry());
  const item = newSlaTier("code-814", "name-152");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
