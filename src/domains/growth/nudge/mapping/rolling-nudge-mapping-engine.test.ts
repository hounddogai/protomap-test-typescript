import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingNudgeMappingEngine } from "./rolling-nudge-mapping-engine.js";
import { newRollingNudgeMapping } from "./rolling-nudge-mapping.js";

test("RollingNudgeMappingEngine keeps results within bounds", () => {
  const engine = defaultRollingNudgeMappingEngine(flags.newRegistry());
  const item = newRollingNudgeMapping("code-515", "title-883");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
