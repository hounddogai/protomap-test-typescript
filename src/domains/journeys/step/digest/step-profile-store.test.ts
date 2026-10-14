import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepProfileStore } from "./step-profile-store.js";
import { newStepProfile } from "./step-profile.js";

test("MemoryStepProfileStore finds what it saved", () => {
  const store = newMemoryStepProfileStore();
  const item = newStepProfile("code-565", "label-927");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
