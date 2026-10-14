import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaRequestEngine } from "./sla-request-engine.js";
import { newSlaRequest } from "./sla-request.js";

test("SlaRequestEngine keeps results within bounds", () => {
  const engine = defaultSlaRequestEngine();
  const item = newSlaRequest("code-898", "name-10");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
