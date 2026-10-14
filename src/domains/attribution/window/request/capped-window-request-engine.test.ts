import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedWindowRequestEngine } from "./capped-window-request-engine.js";
import { newCappedWindowRequest } from "./capped-window-request.js";

test("CappedWindowRequestEngine keeps results within bounds", () => {
  const engine = defaultCappedWindowRequestEngine(flags.newRegistry());
  const item = newCappedWindowRequest("code-550", "title-357");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
