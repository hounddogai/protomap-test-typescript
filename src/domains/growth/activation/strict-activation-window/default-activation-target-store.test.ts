import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultActivationTargetStore } from "./default-activation-target-store.js";
import { newDefaultActivationTarget } from "./default-activation-target.js";

test("MemoryDefaultActivationTargetStore finds what it saved", () => {
  const store = newMemoryDefaultActivationTargetStore();
  const item = newDefaultActivationTarget("code-691", "label-153");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
