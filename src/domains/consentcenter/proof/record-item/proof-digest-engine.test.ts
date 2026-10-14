import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofDigestEngine } from "./proof-digest-engine.js";
import { newProofDigest } from "./proof-digest.js";

test("ProofDigestEngine keeps results within bounds", () => {
  const engine = defaultProofDigestEngine(flags.newRegistry());
  const item = newProofDigest("code-357", "name-388");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
