import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalFunnelRequestEngine } from "./regional-funnel-request-engine.js";
import { newRegionalFunnelRequest } from "./regional-funnel-request.js";

test("RegionalFunnelRequestEngine keeps results within bounds", () => {
  const engine = defaultRegionalFunnelRequestEngine();
  const item = newRegionalFunnelRequest("code-868", "title-809");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
