import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitMappingEngine } from "./wait-mapping-engine.js";
import { newWaitMapping } from "./wait-mapping.js";

test("WaitMappingEngine keeps results within bounds", () => {
  const engine = defaultWaitMappingEngine(flags.newRegistry());
  const item = newWaitMapping("code-243", "name-969");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
