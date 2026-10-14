import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredWindowExceptionEngine } from "./tiered-window-exception-engine.js";
import { newTieredWindowException } from "./tiered-window-exception.js";

test("TieredWindowExceptionEngine keeps results within bounds", () => {
  const engine = defaultTieredWindowExceptionEngine(flags.newRegistry());
  const item = newTieredWindowException("code-333", "title-955");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
