import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultNudgeGroupEngine } from "./nudge-group-engine.js";
import { newNudgeGroup } from "./nudge-group.js";

test("NudgeGroupEngine keeps results within bounds", () => {
  const engine = defaultNudgeGroupEngine(flags.newRegistry());
  const item = newNudgeGroup("code-893", "title-558");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
