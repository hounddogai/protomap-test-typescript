import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainAssignmentEngine } from "./domain-assignment-engine.js";
import { newDomainAssignment } from "./domain-assignment.js";

test("DomainAssignmentEngine keeps results within bounds", () => {
  const engine = defaultDomainAssignmentEngine(flags.newRegistry());
  const item = newDomainAssignment("code-792", "label-259");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
