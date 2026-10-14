import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaPolicyEngine } from "./sla-policy-engine.js";
import { newSlaPolicy } from "./sla-policy.js";

test("SlaPolicyEngine keeps results within bounds", () => {
  const engine = defaultSlaPolicyEngine();
  const item = newSlaPolicy("code-388", "name-434");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
