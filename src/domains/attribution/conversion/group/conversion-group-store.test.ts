import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionGroupStore } from "./conversion-group-store.js";
import { newConversionGroup } from "./conversion-group.js";

test("MemoryConversionGroupStore finds what it saved", () => {
  const store = newMemoryConversionGroupStore();
  const item = newConversionGroup("code-723", "label-777");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
