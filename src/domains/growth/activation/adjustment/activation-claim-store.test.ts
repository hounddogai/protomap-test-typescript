import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationClaimStore } from "./activation-claim-store.js";
import { newActivationClaim } from "./activation-claim.js";

test("MemoryActivationClaimStore finds what it saved", () => {
  const store = newMemoryActivationClaimStore();
  const item = newActivationClaim("code-401", "label-906");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
