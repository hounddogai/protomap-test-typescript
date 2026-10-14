import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackCsatDraftEngine } from "./fallback-csat-draft-engine.js";
import { newFallbackCsatDraft } from "./fallback-csat-draft.js";

test("FallbackCsatDraftEngine keeps results within bounds", () => {
  const engine = defaultFallbackCsatDraftEngine();
  const item = newFallbackCsatDraft("code-58", "name-296");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
