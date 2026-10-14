import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveTierRequestEngine } from "./adaptive-tier-request-engine.js";
import { newAdaptiveTierRequest } from "./adaptive-tier-request.js";

test("AdaptiveTierRequestEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveTierRequestEngine(flags.newRegistry());
  const item = newAdaptiveTierRequest("code-172", "title-822");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
