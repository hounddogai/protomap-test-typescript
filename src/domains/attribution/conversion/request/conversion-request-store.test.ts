import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionRequestStore } from "./conversion-request-store.js";
import { newConversionRequest } from "./conversion-request.js";

test("MemoryConversionRequestStore finds what it saved", () => {
  const store = newMemoryConversionRequestStore();
  const item = newConversionRequest("code-54", "label-332");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
