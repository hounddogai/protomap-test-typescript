import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFunnelDigestStore } from "./rolling-funnel-digest-store.js";
import { newRollingFunnelDigest } from "./rolling-funnel-digest.js";

test("MemoryRollingFunnelDigestStore finds what it saved", () => {
  const store = newMemoryRollingFunnelDigestStore();
  const item = newRollingFunnelDigest("code-42", "title-762");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
