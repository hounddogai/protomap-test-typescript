import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientDeflectionRequestStore } from "./lenient-deflection-request-store.js";
import { newLenientDeflectionRequest } from "./lenient-deflection-request.js";

test("MemoryLenientDeflectionRequestStore finds what it saved", () => {
  const store = newMemoryLenientDeflectionRequestStore();
  const item = newLenientDeflectionRequest("code-422", "label-298");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
