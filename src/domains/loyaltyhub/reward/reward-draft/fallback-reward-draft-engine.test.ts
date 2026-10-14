import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackRewardDraftEngine } from "./fallback-reward-draft-engine.js";
import { newFallbackRewardDraft } from "./fallback-reward-draft.js";

test("FallbackRewardDraftEngine keeps results within bounds", () => {
  const engine = defaultFallbackRewardDraftEngine();
  const item = newFallbackRewardDraft("code-689", "name-760");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
