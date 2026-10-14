import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientCreativeRequestEngine } from "./lenient-creative-request-engine.js";
import { newLenientCreativeRequest } from "./lenient-creative-request.js";

test("LenientCreativeRequestEngine keeps results within bounds", () => {
  const engine = defaultLenientCreativeRequestEngine();
  const item = newLenientCreativeRequest("code-884", "label-460");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
