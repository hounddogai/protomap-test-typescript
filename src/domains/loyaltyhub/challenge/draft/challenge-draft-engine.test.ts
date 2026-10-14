import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultChallengeDraftEngine } from "./challenge-draft-engine.js";
import { newChallengeDraft } from "./challenge-draft.js";

test("ChallengeDraftEngine keeps results within bounds", () => {
  const engine = defaultChallengeDraftEngine();
  const item = newChallengeDraft("code-258", "label-270");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
