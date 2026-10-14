import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeExceptionStore } from "./nudge-exception-store.js";
import { newNudgeException } from "./nudge-exception.js";

test("MemoryNudgeExceptionStore finds what it saved", () => {
  const store = newMemoryNudgeExceptionStore();
  const item = newNudgeException("code-839", "label-861");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
