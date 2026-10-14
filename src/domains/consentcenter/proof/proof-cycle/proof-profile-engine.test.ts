import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofProfileEngine } from "./proof-profile-engine.js";
import { newProofProfile } from "./proof-profile.js";

test("ProofProfileEngine keeps results within bounds", () => {
  const engine = defaultProofProfileEngine(flags.newRegistry());
  const item = newProofProfile("code-669", "label-53");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
