import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultWarmupAssignmentEngine } from "./default-warmup-assignment-engine.js";
import { newDefaultWarmupAssignment } from "./default-warmup-assignment.js";

test("DefaultWarmupAssignmentEngine keeps results within bounds", () => {
  const engine = defaultDefaultWarmupAssignmentEngine();
  const item = newDefaultWarmupAssignment("code-563", "title-429");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
