import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPaywallCheckpointStore } from "./default-paywall-checkpoint-store.js";
import { newDefaultPaywallCheckpoint } from "./default-paywall-checkpoint.js";

test("MemoryDefaultPaywallCheckpointStore finds what it saved", () => {
  const store = newMemoryDefaultPaywallCheckpointStore();
  const item = newDefaultPaywallCheckpoint("code-642", "name-734");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
