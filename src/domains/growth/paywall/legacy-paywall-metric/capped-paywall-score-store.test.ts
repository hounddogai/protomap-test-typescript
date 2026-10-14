import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPaywallScoreStore } from "./capped-paywall-score-store.js";
import { newCappedPaywallScore } from "./capped-paywall-score.js";

test("MemoryCappedPaywallScoreStore finds what it saved", () => {
  const store = newMemoryCappedPaywallScoreStore();
  const item = newCappedPaywallScore("code-183", "label-400");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
