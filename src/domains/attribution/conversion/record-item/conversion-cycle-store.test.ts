import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionCycleStore } from "./conversion-cycle-store.js";
import { newConversionCycle } from "./conversion-cycle.js";

test("MemoryConversionCycleStore finds what it saved", () => {
  const store = newMemoryConversionCycleStore();
  const item = newConversionCycle("code-477", "name-325");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
