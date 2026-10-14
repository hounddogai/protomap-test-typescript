import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepExceptionStore } from "./step-exception-store.js";
import { newStepException } from "./step-exception.js";

test("MemoryStepExceptionStore finds what it saved", () => {
  const store = newMemoryStepExceptionStore();
  const item = newStepException("code-747", "label-461");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
