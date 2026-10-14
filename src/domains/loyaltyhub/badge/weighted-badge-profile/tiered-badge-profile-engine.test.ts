import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredBadgeProfileEngine } from "./tiered-badge-profile-engine.js";
import { newTieredBadgeProfile } from "./tiered-badge-profile.js";

test("TieredBadgeProfileEngine keeps results within bounds", () => {
  const engine = defaultTieredBadgeProfileEngine(flags.newRegistry());
  const item = newTieredBadgeProfile("code-675", "title-744");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
