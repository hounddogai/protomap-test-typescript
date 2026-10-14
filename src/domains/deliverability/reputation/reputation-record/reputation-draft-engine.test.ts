import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationDraftEngine } from "./reputation-draft-engine.js";
import { newReputationDraft } from "./reputation-draft.js";

test("ReputationDraftEngine keeps results within bounds", () => {
  const engine = defaultReputationDraftEngine();
  const item = newReputationDraft("code-565", "name-286");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
