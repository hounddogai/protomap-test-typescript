import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalBadgeProfileEngine } from "./global-badge-profile-engine.js";
import { newGlobalBadgeProfile } from "./global-badge-profile.js";

test("GlobalBadgeProfileEngine keeps results within bounds", () => {
  const engine = defaultGlobalBadgeProfileEngine();
  const item = newGlobalBadgeProfile("code-886", "name-809");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
