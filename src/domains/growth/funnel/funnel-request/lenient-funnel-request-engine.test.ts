import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientFunnelRequestEngine } from "./lenient-funnel-request-engine.js";
import { newLenientFunnelRequest } from "./lenient-funnel-request.js";

test("LenientFunnelRequestEngine keeps results within bounds", () => {
  const engine = defaultLenientFunnelRequestEngine();
  const item = newLenientFunnelRequest("code-17", "title-931");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
