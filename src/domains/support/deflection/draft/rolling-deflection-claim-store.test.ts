import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingDeflectionClaimStore } from "./rolling-deflection-claim-store.js";
import { newRollingDeflectionClaim } from "./rolling-deflection-claim.js";

test("MemoryRollingDeflectionClaimStore finds what it saved", () => {
  const store = newMemoryRollingDeflectionClaimStore();
  const item = newRollingDeflectionClaim("code-659", "title-387");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
