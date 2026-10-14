import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightDigestStore } from "./flight-digest-store.js";
import { newFlightDigest } from "./flight-digest.js";

test("MemoryFlightDigestStore finds what it saved", () => {
  const store = newMemoryFlightDigestStore();
  const item = newFlightDigest("code-762", "name-750");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
