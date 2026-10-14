import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualInviteCheckpointStore } from "./manual-invite-checkpoint-store.js";
import { newManualInviteCheckpoint } from "./manual-invite-checkpoint.js";

test("MemoryManualInviteCheckpointStore finds what it saved", () => {
  const store = newMemoryManualInviteCheckpointStore();
  const item = newManualInviteCheckpoint("code-722", "label-823");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
