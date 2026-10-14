import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWarmupOverrideEngine } from "./warmup-override-engine.js";
import { newWarmupOverride } from "./warmup-override.js";

test("WarmupOverrideEngine keeps results within bounds", () => {
  const engine = defaultWarmupOverrideEngine(flags.newRegistry());
  const item = newWarmupOverride("code-91", "name-670");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
