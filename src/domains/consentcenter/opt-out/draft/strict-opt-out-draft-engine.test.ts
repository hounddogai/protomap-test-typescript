import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictOptOutDraftEngine } from "./strict-opt-out-draft-engine.js";
import { newStrictOptOutDraft } from "./strict-opt-out-draft.js";

test("StrictOptOutDraftEngine keeps results within bounds", () => {
  const engine = defaultStrictOptOutDraftEngine(flags.newRegistry());
  const item = newStrictOptOutDraft("code-166", "title-791");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
