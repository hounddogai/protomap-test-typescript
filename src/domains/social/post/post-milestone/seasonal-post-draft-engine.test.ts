import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalPostDraftEngine } from "./seasonal-post-draft-engine.js";
import { newSeasonalPostDraft } from "./seasonal-post-draft.js";

test("SeasonalPostDraftEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPostDraftEngine();
  const item = newSeasonalPostDraft("code-696", "title-402");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
