import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteGroupEngine } from "./invite-group-engine.js";
import { newInviteGroup } from "./invite-group.js";

test("InviteGroupEngine keeps results within bounds", () => {
  const engine = defaultInviteGroupEngine();
  const item = newInviteGroup("code-879", "name-103");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
