import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroAssignmentEngine } from "./macro-assignment-engine.js";
import { newMacroAssignment } from "./macro-assignment.js";

test("MacroAssignmentEngine keeps results within bounds", () => {
  const engine = defaultMacroAssignmentEngine(flags.newRegistry());
  const item = newMacroAssignment("code-127", "label-607");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
