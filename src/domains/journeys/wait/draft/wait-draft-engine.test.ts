import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitDraftEngine } from "./wait-draft-engine.js";
import { newWaitDraft } from "./wait-draft.js";

test("WaitDraftEngine keeps results within bounds", () => {
  const engine = defaultWaitDraftEngine();
  const item = newWaitDraft("code-827", "title-916");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
