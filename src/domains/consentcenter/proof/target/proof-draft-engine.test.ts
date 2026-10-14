import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultProofDraftEngine } from "./proof-draft-engine.js";
import { newProofDraft } from "./proof-draft.js";

test("ProofDraftEngine keeps results within bounds", () => {
  const engine = defaultProofDraftEngine();
  const item = newProofDraft("code-74", "name-482");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
