import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedNudgeMappingEngine } from "./capped-nudge-mapping-engine.js";
import { newCappedNudgeMapping } from "./capped-nudge-mapping.js";

test("CappedNudgeMappingEngine keeps results within bounds", () => {
  const engine = defaultCappedNudgeMappingEngine(flags.newRegistry());
  const item = newCappedNudgeMapping("code-694", "label-980");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
