import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutOverrideEngine } from "./opt-out-override-engine.js";
import { newOptOutOverride } from "./opt-out-override.js";

test("OptOutOverrideEngine keeps results within bounds", () => {
  const engine = defaultOptOutOverrideEngine(flags.newRegistry());
  const item = newOptOutOverride("code-536", "title-69");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
