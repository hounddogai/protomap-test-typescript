import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationWindowEngine } from "./reputation-window-engine.js";
import { newReputationWindow } from "./reputation-window.js";

test("ReputationWindowEngine keeps results within bounds", () => {
  const engine = defaultReputationWindowEngine(flags.newRegistry());
  const item = newReputationWindow("code-381", "label-615");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
