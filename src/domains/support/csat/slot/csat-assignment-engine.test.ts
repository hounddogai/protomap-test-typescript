import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatAssignmentEngine } from "./csat-assignment-engine.js";
import { newCsatAssignment } from "./csat-assignment.js";

test("CsatAssignmentEngine keeps results within bounds", () => {
  const engine = defaultCsatAssignmentEngine();
  const item = newCsatAssignment("code-610", "name-971");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
