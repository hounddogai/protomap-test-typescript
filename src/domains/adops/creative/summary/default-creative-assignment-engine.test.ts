import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultCreativeAssignmentEngine } from "./default-creative-assignment-engine.js";
import { newDefaultCreativeAssignment } from "./default-creative-assignment.js";

test("DefaultCreativeAssignmentEngine keeps results within bounds", () => {
  const engine = defaultDefaultCreativeAssignmentEngine(flags.newRegistry());
  const item = newDefaultCreativeAssignment("code-314", "label-307");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
