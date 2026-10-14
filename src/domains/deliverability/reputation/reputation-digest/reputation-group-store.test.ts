import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationGroupStore } from "./reputation-group-store.js";
import { newReputationGroup } from "./reputation-group.js";

test("MemoryReputationGroupStore finds what it saved", () => {
  const store = newMemoryReputationGroupStore();
  const item = newReputationGroup("code-287", "label-385");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
