import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictCreativeDraftEngine } from "./strict-creative-draft-engine.js";
import { newStrictCreativeDraft } from "./strict-creative-draft.js";

test("StrictCreativeDraftEngine keeps results within bounds", () => {
  const engine = defaultStrictCreativeDraftEngine(flags.newRegistry());
  const item = newStrictCreativeDraft("code-742", "name-833");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
