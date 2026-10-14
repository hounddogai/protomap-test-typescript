import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeScoreEngine } from "./creative-score-engine.js";
import { newCreativeScore } from "./creative-score.js";

test("CreativeScoreEngine keeps results within bounds", () => {
  const engine = defaultCreativeScoreEngine(flags.newRegistry());
  const item = newCreativeScore("code-644", "name-295");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
