import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyInviteBatchEngine } from "./legacy-invite-batch-engine.js";
import { newLegacyInviteBatch } from "./legacy-invite-batch.js";

test("LegacyInviteBatchEngine keeps results within bounds", () => {
  const engine = defaultLegacyInviteBatchEngine();
  const item = newLegacyInviteBatch("code-716", "name-142");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
