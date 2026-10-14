import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyDigestStore } from "./frequency-digest-store.js";
import { newFrequencyDigest } from "./frequency-digest.js";

test("MemoryFrequencyDigestStore finds what it saved", () => {
  const store = newMemoryFrequencyDigestStore();
  const item = newFrequencyDigest("code-505", "name-591");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
