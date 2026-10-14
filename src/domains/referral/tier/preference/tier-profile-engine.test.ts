import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierProfileEngine } from "./tier-profile-engine.js";
import { newTierProfile } from "./tier-profile.js";

test("TierProfileEngine keeps results within bounds", () => {
  const engine = defaultTierProfileEngine();
  const item = newTierProfile("code-795", "name-582");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
