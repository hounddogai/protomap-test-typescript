import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualApprovalDraftEngine } from "./manual-approval-draft-engine.js";
import { newManualApprovalDraft } from "./manual-approval-draft.js";

test("ManualApprovalDraftEngine keeps results within bounds", () => {
  const engine = defaultManualApprovalDraftEngine();
  const item = newManualApprovalDraft("code-67", "label-256");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
