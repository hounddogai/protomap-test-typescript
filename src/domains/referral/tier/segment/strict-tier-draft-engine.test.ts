import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictTierDraftEngine } from "./strict-tier-draft-engine.js";
import { newStrictTierDraft } from "./strict-tier-draft.js";

test("StrictTierDraftEngine keeps results within bounds", () => {
  const engine = defaultStrictTierDraftEngine();
  const item = newStrictTierDraft("code-550", "name-671");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
