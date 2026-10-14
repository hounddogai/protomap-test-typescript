import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyInviteBatchStore } from "./legacy-invite-batch-store.js";
import { newLegacyInviteBatch } from "./legacy-invite-batch.js";

test("MemoryLegacyInviteBatchStore finds what it saved", () => {
  const store = newMemoryLegacyInviteBatchStore();
  const item = newLegacyInviteBatch("code-716", "name-142");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
