import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeDraftEngine } from "./nudge-draft-engine.js";
import { newNudgeDraft } from "./nudge-draft.js";

test("NudgeDraftEngine keeps results within bounds", () => {
  const engine = defaultNudgeDraftEngine();
  const item = newNudgeDraft("code-676", "title-382");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
