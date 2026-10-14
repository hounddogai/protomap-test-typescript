import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedOptOutRequestEngine } from "./capped-opt-out-request-engine.js";
import { newCappedOptOutRequest } from "./capped-opt-out-request.js";

test("CappedOptOutRequestEngine keeps results within bounds", () => {
  const engine = defaultCappedOptOutRequestEngine(flags.newRegistry());
  const item = newCappedOptOutRequest("code-949", "title-342");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
