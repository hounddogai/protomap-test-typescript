import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedInviteEntryEngine } from "./batched-invite-entry-engine.js";
import { newBatchedInviteEntry } from "./batched-invite-entry.js";

test("BatchedInviteEntryEngine keeps results within bounds", () => {
  const engine = defaultBatchedInviteEntryEngine();
  const item = newBatchedInviteEntry("code-716", "label-99");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
