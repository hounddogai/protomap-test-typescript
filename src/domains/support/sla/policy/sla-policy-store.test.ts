import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaPolicyStore } from "./sla-policy-store.js";
import { newSlaPolicy } from "./sla-policy.js";

test("MemorySlaPolicyStore finds what it saved", () => {
  const store = newMemorySlaPolicyStore();
  const item = newSlaPolicy("code-388", "name-434");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
