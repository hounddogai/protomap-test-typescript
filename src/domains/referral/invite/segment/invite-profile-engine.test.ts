import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteProfileEngine } from "./invite-profile-engine.js";
import { newInviteProfile } from "./invite-profile.js";

test("InviteProfileEngine keeps results within bounds", () => {
  const engine = defaultInviteProfileEngine(flags.newRegistry());
  const item = newInviteProfile("code-63", "title-666");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
