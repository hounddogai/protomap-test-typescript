import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictNudgeMappingEngine } from "./strict-nudge-mapping-engine.js";
import { newStrictNudgeMapping } from "./strict-nudge-mapping.js";

test("StrictNudgeMappingEngine keeps results within bounds", () => {
  const engine = defaultStrictNudgeMappingEngine(flags.newRegistry());
  const item = newStrictNudgeMapping("code-193", "name-47");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
