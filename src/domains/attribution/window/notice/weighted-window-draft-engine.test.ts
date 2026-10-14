import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedWindowDraftEngine } from "./weighted-window-draft-engine.js";
import { newWeightedWindowDraft } from "./weighted-window-draft.js";

test("WeightedWindowDraftEngine keeps results within bounds", () => {
  const engine = defaultWeightedWindowDraftEngine();
  const item = newWeightedWindowDraft("code-561", "label-719");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
