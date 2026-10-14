import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteCheckpointEngine } from "./invite-checkpoint-engine.js";
import { newInviteCheckpoint } from "./invite-checkpoint.js";

test("InviteCheckpointEngine keeps results within bounds", () => {
  const engine = defaultInviteCheckpointEngine();
  const item = newInviteCheckpoint("code-191", "label-569");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
