import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelAssignmentEngine } from "./funnel-assignment-engine.js";
import { newFunnelAssignment } from "./funnel-assignment.js";

test("FunnelAssignmentEngine keeps results within bounds", () => {
  const engine = defaultFunnelAssignmentEngine();
  const item = newFunnelAssignment("code-560", "title-610");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
