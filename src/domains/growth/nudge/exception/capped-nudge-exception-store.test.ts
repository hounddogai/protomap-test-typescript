import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedNudgeExceptionStore } from "./capped-nudge-exception-store.js";
import { newCappedNudgeException } from "./capped-nudge-exception.js";

test("MemoryCappedNudgeExceptionStore finds what it saved", () => {
  const store = newMemoryCappedNudgeExceptionStore();
  const item = newCappedNudgeException("code-99", "label-99");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
