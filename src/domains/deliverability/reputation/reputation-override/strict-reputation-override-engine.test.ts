import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictReputationOverrideEngine } from "./strict-reputation-override-engine.js";
import { newStrictReputationOverride } from "./strict-reputation-override.js";

test("StrictReputationOverrideEngine keeps results within bounds", () => {
  const engine = defaultStrictReputationOverrideEngine(flags.newRegistry());
  const item = newStrictReputationOverride("code-407", "label-127");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
