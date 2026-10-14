import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledChallengeWindowEngine } from "./scheduled-challenge-window-engine.js";
import { newScheduledChallengeWindow } from "./scheduled-challenge-window.js";

test("ScheduledChallengeWindowEngine keeps results within bounds", () => {
  const engine = defaultScheduledChallengeWindowEngine(flags.newRegistry());
  const item = newScheduledChallengeWindow("code-31", "title-758");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
