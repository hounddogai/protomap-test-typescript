import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowExceptionEngine } from "./window-exception-engine.js";
import { newWindowException } from "./window-exception.js";

test("WindowExceptionEngine keeps results within bounds", () => {
  const engine = defaultWindowExceptionEngine(flags.newRegistry());
  const item = newWindowException("code-938", "name-561");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
