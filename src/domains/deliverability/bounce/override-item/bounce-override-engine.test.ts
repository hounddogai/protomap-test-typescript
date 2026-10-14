import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceOverrideEngine } from "./bounce-override-engine.js";
import { newBounceOverride } from "./bounce-override.js";

test("BounceOverrideEngine keeps results within bounds", () => {
  const engine = defaultBounceOverrideEngine(flags.newRegistry());
  const item = newBounceOverride("code-546", "title-899");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
