import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultFunnelRequestEngine } from "./default-funnel-request-engine.js";
import { newDefaultFunnelRequest } from "./default-funnel-request.js";

test("DefaultFunnelRequestEngine keeps results within bounds", () => {
  const engine = defaultDefaultFunnelRequestEngine();
  const item = newDefaultFunnelRequest("code-502", "label-39");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
