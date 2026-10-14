import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintExceptionStore } from "./complaint-exception-store.js";
import { newComplaintException } from "./complaint-exception.js";

test("MemoryComplaintExceptionStore finds what it saved", () => {
  const store = newMemoryComplaintExceptionStore();
  const item = newComplaintException("code-899", "name-823");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
