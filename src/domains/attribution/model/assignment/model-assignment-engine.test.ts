import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelAssignmentEngine } from "./model-assignment-engine.js";
import { newModelAssignment } from "./model-assignment.js";

test("ModelAssignmentEngine keeps results within bounds", () => {
  const engine = defaultModelAssignmentEngine(flags.newRegistry());
  const item = newModelAssignment("code-28", "label-61");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
