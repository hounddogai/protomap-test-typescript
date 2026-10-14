import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingOptOutProfileEngine } from "./pending-opt-out-profile-engine.js";
import { newPendingOptOutProfile } from "./pending-opt-out-profile.js";

test("PendingOptOutProfileEngine keeps results within bounds", () => {
  const engine = defaultPendingOptOutProfileEngine(flags.newRegistry());
  const item = newPendingOptOutProfile("code-269", "name-299");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
