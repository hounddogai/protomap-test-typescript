import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteCheckpointStore } from "./invite-checkpoint-store.js";
import { newInviteCheckpoint } from "./invite-checkpoint.js";

test("MemoryInviteCheckpointStore finds what it saved", () => {
  const store = newMemoryInviteCheckpointStore();
  const item = newInviteCheckpoint("code-191", "label-569");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
