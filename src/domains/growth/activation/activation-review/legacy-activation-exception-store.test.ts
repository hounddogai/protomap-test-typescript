import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyActivationExceptionStore } from "./legacy-activation-exception-store.js";
import { newLegacyActivationException } from "./legacy-activation-exception.js";

test("MemoryLegacyActivationExceptionStore finds what it saved", () => {
  const store = newMemoryLegacyActivationExceptionStore();
  const item = newLegacyActivationException("code-95", "name-661");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
