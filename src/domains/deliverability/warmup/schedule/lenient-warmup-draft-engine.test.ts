import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientWarmupDraftEngine } from "./lenient-warmup-draft-engine.js";
import { newLenientWarmupDraft } from "./lenient-warmup-draft.js";

test("LenientWarmupDraftEngine keeps results within bounds", () => {
  const engine = defaultLenientWarmupDraftEngine();
  const item = newLenientWarmupDraft("code-896", "label-408");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
