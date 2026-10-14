import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedProofProfileEngine } from "./batched-proof-profile-engine.js";
import { newBatchedProofProfile } from "./batched-proof-profile.js";

test("BatchedProofProfileEngine keeps results within bounds", () => {
  const engine = defaultBatchedProofProfileEngine(flags.newRegistry());
  const item = newBatchedProofProfile("code-486", "label-731");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
