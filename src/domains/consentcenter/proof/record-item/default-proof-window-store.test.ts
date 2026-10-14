import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultProofWindowStore } from "./default-proof-window-store.js";
import { newDefaultProofWindow } from "./default-proof-window.js";

test("MemoryDefaultProofWindowStore finds what it saved", () => {
  const store = newMemoryDefaultProofWindowStore();
  const item = newDefaultProofWindow("code-591", "name-814");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
