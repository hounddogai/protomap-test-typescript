import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceAssignmentEngine } from "./bounce-assignment-engine.js";
import { newBounceAssignment } from "./bounce-assignment.js";

test("BounceAssignmentEngine keeps results within bounds", () => {
  const engine = defaultBounceAssignmentEngine(flags.newRegistry());
  const item = newBounceAssignment("code-529", "title-24");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
