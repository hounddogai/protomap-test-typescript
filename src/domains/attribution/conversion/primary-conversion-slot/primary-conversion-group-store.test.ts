import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryConversionGroupStore } from "./primary-conversion-group-store.js";
import { newPrimaryConversionGroup } from "./primary-conversion-group.js";

test("MemoryPrimaryConversionGroupStore finds what it saved", () => {
  const store = newMemoryPrimaryConversionGroupStore();
  const item = newPrimaryConversionGroup("code-9", "title-152");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
