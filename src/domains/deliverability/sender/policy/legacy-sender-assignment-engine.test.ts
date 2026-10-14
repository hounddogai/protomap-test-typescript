import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacySenderAssignmentEngine } from "./legacy-sender-assignment-engine.js";
import { newLegacySenderAssignment } from "./legacy-sender-assignment.js";

test("LegacySenderAssignmentEngine keeps results within bounds", () => {
  const engine = defaultLegacySenderAssignmentEngine(flags.newRegistry());
  const item = newLegacySenderAssignment("code-935", "name-651");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
