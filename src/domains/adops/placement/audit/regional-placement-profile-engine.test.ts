import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalPlacementProfileEngine } from "./regional-placement-profile-engine.js";
import { newRegionalPlacementProfile } from "./regional-placement-profile.js";

test("RegionalPlacementProfileEngine keeps results within bounds", () => {
  const engine = defaultRegionalPlacementProfileEngine();
  const item = newRegionalPlacementProfile("code-97", "title-361");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
