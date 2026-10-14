import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalReplyWindowEngine } from "./seasonal-reply-window-engine.js";
import { newSeasonalReplyWindow } from "./seasonal-reply-window.js";

test("SeasonalReplyWindowEngine keeps results within bounds", () => {
  const engine = defaultSeasonalReplyWindowEngine();
  const item = newSeasonalReplyWindow("code-996", "label-833");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
