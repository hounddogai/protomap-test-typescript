import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedStepRequestStore } from "./capped-step-request-store.js";
import { newCappedStepRequest } from "./capped-step-request.js";

test("MemoryCappedStepRequestStore finds what it saved", () => {
  const store = newMemoryCappedStepRequestStore();
  const item = newCappedStepRequest("code-796", "label-153");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
