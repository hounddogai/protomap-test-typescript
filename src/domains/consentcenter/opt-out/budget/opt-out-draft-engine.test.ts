import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptOutDraftEngine } from "./opt-out-draft-engine.js";
import { newOptOutDraft } from "./opt-out-draft.js";

test("OptOutDraftEngine keeps results within bounds", () => {
  const engine = defaultOptOutDraftEngine();
  const item = newOptOutDraft("code-185", "label-655");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
