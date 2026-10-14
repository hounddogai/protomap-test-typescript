import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowRequestEngine } from "./window-request-engine.js";
import { newWindowRequest } from "./window-request.js";

test("WindowRequestEngine keeps results within bounds", () => {
  const engine = defaultWindowRequestEngine(flags.newRegistry());
  const item = newWindowRequest("code-699", "title-550");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
