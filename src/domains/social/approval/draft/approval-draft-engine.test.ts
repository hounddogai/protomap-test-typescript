import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalDraftEngine } from "./approval-draft-engine.js";
import { newApprovalDraft } from "./approval-draft.js";

test("ApprovalDraftEngine keeps results within bounds", () => {
  const engine = defaultApprovalDraftEngine();
  const item = newApprovalDraft("code-314", "title-987");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
