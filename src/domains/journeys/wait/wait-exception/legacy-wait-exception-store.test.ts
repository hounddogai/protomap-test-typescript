import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyWaitExceptionStore } from "./legacy-wait-exception-store.js";
import { newLegacyWaitException } from "./legacy-wait-exception.js";

test("MemoryLegacyWaitExceptionStore finds what it saved", () => {
  const store = newMemoryLegacyWaitExceptionStore();
  const item = newLegacyWaitException("code-782", "name-923");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
