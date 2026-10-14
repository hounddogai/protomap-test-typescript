import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredInviteProfileEngine } from "./tiered-invite-profile-engine.js";
import { newTieredInviteProfile } from "./tiered-invite-profile.js";

test("TieredInviteProfileEngine keeps results within bounds", () => {
  const engine = defaultTieredInviteProfileEngine();
  const item = newTieredInviteProfile("code-274", "title-21");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
