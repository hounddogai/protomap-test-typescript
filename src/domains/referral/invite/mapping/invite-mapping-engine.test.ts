import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteMappingEngine } from "./invite-mapping-engine.js";
import { newInviteMapping } from "./invite-mapping.js";

test("InviteMappingEngine keeps results within bounds", () => {
  const engine = defaultInviteMappingEngine();
  const item = newInviteMapping("code-585", "name-855");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
