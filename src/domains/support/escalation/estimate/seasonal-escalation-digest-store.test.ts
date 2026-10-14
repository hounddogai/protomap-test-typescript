import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalEscalationDigestStore } from "./seasonal-escalation-digest-store.js";
import { newSeasonalEscalationDigest } from "./seasonal-escalation-digest.js";

test("MemorySeasonalEscalationDigestStore finds what it saved", () => {
  const store = newMemorySeasonalEscalationDigestStore();
  const item = newSeasonalEscalationDigest("code-710", "name-46");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
