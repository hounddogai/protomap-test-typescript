import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingWaitProfileEngine } from "./rolling-wait-profile-engine.js";
import { newRollingWaitProfile } from "./rolling-wait-profile.js";

test("RollingWaitProfileEngine keeps results within bounds", () => {
  const engine = defaultRollingWaitProfileEngine();
  const item = newRollingWaitProfile("code-47", "name-573");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
