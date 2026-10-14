import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingSlaTierEngine } from "./rolling-sla-tier-engine.js";
import { newRollingSlaTier } from "./rolling-sla-tier.js";

test("RollingSlaTierEngine keeps results within bounds", () => {
  const engine = defaultRollingSlaTierEngine(flags.newRegistry());
  const item = newRollingSlaTier("code-861", "label-848");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
