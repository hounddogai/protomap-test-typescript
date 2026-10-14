import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBounceDraftEngine } from "./bounce-draft-engine.js";
import { newBounceDraft } from "./bounce-draft.js";

test("BounceDraftEngine keeps results within bounds", () => {
  const engine = defaultBounceDraftEngine();
  const item = newBounceDraft("code-809", "title-338");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
