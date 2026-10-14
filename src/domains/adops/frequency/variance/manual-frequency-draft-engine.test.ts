import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualFrequencyDraftEngine } from "./manual-frequency-draft-engine.js";
import { newManualFrequencyDraft } from "./manual-frequency-draft.js";

test("ManualFrequencyDraftEngine keeps results within bounds", () => {
  const engine = defaultManualFrequencyDraftEngine();
  const item = newManualFrequencyDraft("code-932", "title-545");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
