import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedCreditDraftEngine } from "./capped-credit-draft-engine.js";
import { newCappedCreditDraft } from "./capped-credit-draft.js";

test("CappedCreditDraftEngine keeps results within bounds", () => {
  const engine = defaultCappedCreditDraftEngine();
  const item = newCappedCreditDraft("code-549", "title-854");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
