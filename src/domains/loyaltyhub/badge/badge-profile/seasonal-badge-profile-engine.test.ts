import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalBadgeProfileEngine } from "./seasonal-badge-profile-engine.js";
import { newSeasonalBadgeProfile } from "./seasonal-badge-profile.js";

test("SeasonalBadgeProfileEngine keeps results within bounds", () => {
  const engine = defaultSeasonalBadgeProfileEngine();
  const item = newSeasonalBadgeProfile("code-800", "name-575");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
