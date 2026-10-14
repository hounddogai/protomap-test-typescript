import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultEnrollmentProposalEngine } from "./enrollment-proposal-engine.js";
import { newEnrollmentProposal } from "./enrollment-proposal.js";

test("EnrollmentProposalEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentProposalEngine(flags.newRegistry());
  const item = newEnrollmentProposal("code-422", "name-246");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
