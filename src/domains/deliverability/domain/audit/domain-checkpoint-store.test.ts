import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainCheckpointStore } from "./domain-checkpoint-store.js";
import { newDomainCheckpoint } from "./domain-checkpoint.js";

test("MemoryDomainCheckpointStore finds what it saved", () => {
  const store = newMemoryDomainCheckpointStore();
  const item = newDomainCheckpoint("code-696", "name-997");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
