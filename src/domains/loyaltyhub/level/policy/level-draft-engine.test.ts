import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLevelDraftEngine } from "./level-draft-engine.js";
import { newLevelDraft } from "./level-draft.js";

test("LevelDraftEngine keeps results within bounds", () => {
  const engine = defaultLevelDraftEngine(flags.newRegistry());
  const item = newLevelDraft("code-429", "title-108");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
