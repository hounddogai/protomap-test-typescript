import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictInviteGroupEngine } from "./strict-invite-group-engine.js";
import { newStrictInviteGroup } from "./strict-invite-group.js";

test("StrictInviteGroupEngine keeps results within bounds", () => {
  const engine = defaultStrictInviteGroupEngine();
  const item = newStrictInviteGroup("code-59", "name-672");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
