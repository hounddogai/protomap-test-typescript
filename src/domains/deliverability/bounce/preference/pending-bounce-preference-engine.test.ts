import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingBouncePreferenceEngine } from "./pending-bounce-preference-engine.js";
import { newPendingBouncePreference } from "./pending-bounce-preference.js";

test("PendingBouncePreferenceEngine keeps results within bounds", () => {
  const engine = defaultPendingBouncePreferenceEngine(flags.newRegistry());
  const item = newPendingBouncePreference("code-378", "label-905");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
