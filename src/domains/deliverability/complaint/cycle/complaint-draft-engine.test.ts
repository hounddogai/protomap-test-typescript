import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintDraftEngine } from "./complaint-draft-engine.js";
import { newComplaintDraft } from "./complaint-draft.js";

test("ComplaintDraftEngine keeps results within bounds", () => {
  const engine = defaultComplaintDraftEngine();
  const item = newComplaintDraft("code-484", "name-261");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
