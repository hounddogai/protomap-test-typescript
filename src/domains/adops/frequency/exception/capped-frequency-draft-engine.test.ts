import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedFrequencyDraftEngine } from "./capped-frequency-draft-engine.js";
import { newCappedFrequencyDraft } from "./capped-frequency-draft.js";

test("CappedFrequencyDraftEngine keeps results within bounds", () => {
  const engine = defaultCappedFrequencyDraftEngine();
  const item = newCappedFrequencyDraft("code-419", "title-116");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
