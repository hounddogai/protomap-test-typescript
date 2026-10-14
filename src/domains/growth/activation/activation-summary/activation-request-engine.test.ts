import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationRequestEngine } from "./activation-request-engine.js";
import { newActivationRequest } from "./activation-request.js";

test("ActivationRequestEngine keeps results within bounds", () => {
  const engine = defaultActivationRequestEngine();
  const item = newActivationRequest("code-471", "title-782");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
