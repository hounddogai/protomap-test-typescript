import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofMilestoneEngine } from "./proof-milestone-engine.js";
import { newProofMilestone } from "./proof-milestone.js";

test("ProofMilestoneEngine keeps results within bounds", () => {
  const engine = defaultProofMilestoneEngine(flags.newRegistry());
  const item = newProofMilestone("code-194", "name-276");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
