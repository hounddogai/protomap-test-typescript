import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeDraftEngine } from "./creative-draft-engine.js";
import { newCreativeDraft } from "./creative-draft.js";

test("CreativeDraftEngine keeps results within bounds", () => {
  const engine = defaultCreativeDraftEngine();
  const item = newCreativeDraft("code-339", "name-565");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
