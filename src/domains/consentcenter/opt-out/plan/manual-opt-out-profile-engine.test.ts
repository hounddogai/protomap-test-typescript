import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualOptOutProfileEngine } from "./manual-opt-out-profile-engine.js";
import { newManualOptOutProfile } from "./manual-opt-out-profile.js";

test("ManualOptOutProfileEngine keeps results within bounds", () => {
  const engine = defaultManualOptOutProfileEngine(flags.newRegistry());
  const item = newManualOptOutProfile("code-302", "name-104");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
