import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationRequestStore } from "./activation-request-store.js";
import { newActivationRequest } from "./activation-request.js";

test("MemoryActivationRequestStore finds what it saved", () => {
  const store = newMemoryActivationRequestStore();
  const item = newActivationRequest("code-471", "title-782");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
