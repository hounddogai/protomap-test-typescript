import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingLevelPreferenceEngine } from "./pending-level-preference-engine.js";
import { newPendingLevelPreference } from "./pending-level-preference.js";

test("PendingLevelPreferenceEngine keeps results within bounds", () => {
  const engine = defaultPendingLevelPreferenceEngine(flags.newRegistry());
  const item = newPendingLevelPreference("code-850", "name-440");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
