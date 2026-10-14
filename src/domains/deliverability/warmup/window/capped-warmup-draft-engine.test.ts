import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedWarmupDraftEngine } from "./capped-warmup-draft-engine.js";
import { newCappedWarmupDraft } from "./capped-warmup-draft.js";

test("CappedWarmupDraftEngine keeps results within bounds", () => {
  const engine = defaultCappedWarmupDraftEngine();
  const item = newCappedWarmupDraft("code-490", "name-326");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
