import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictLevelAssignmentEngine } from "./strict-level-assignment-engine.js";
import { newStrictLevelAssignment } from "./strict-level-assignment.js";

test("StrictLevelAssignmentEngine keeps results within bounds", () => {
  const engine = defaultStrictLevelAssignmentEngine(flags.newRegistry());
  const item = newStrictLevelAssignment("code-26", "title-264");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
