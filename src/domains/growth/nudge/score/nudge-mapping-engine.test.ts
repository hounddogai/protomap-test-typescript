import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeMappingEngine } from "./nudge-mapping-engine.js";
import { newNudgeMapping } from "./nudge-mapping.js";

test("NudgeMappingEngine keeps results within bounds", () => {
  const engine = defaultNudgeMappingEngine();
  const item = newNudgeMapping("code-70", "name-313");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
