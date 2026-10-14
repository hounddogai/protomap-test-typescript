import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionGroupStore } from "./deflection-group-store.js";
import { newDeflectionGroup } from "./deflection-group.js";

test("MemoryDeflectionGroupStore finds what it saved", () => {
  const store = newMemoryDeflectionGroupStore();
  const item = newDeflectionGroup("code-217", "title-389");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
