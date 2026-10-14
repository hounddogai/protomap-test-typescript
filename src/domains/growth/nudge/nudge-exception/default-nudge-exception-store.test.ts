import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultNudgeExceptionStore } from "./default-nudge-exception-store.js";
import { newDefaultNudgeException } from "./default-nudge-exception.js";

test("MemoryDefaultNudgeExceptionStore finds what it saved", () => {
  const store = newMemoryDefaultNudgeExceptionStore();
  const item = newDefaultNudgeException("code-791", "label-69");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
