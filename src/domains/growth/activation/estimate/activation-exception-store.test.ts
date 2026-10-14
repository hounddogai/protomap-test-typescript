import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationExceptionStore } from "./activation-exception-store.js";
import { newActivationException } from "./activation-exception.js";

test("MemoryActivationExceptionStore finds what it saved", () => {
  const store = newMemoryActivationExceptionStore();
  const item = newActivationException("code-460", "name-307");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
