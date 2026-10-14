import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeOverrideView, toChallengeOverrideViews } from "./challenge-override-view.js";
import { newChallengeOverride } from "./challenge-override.js";

test("ChallengeOverrideView shows the status in capitals", () => {
  const item = newChallengeOverride("code-334", "name-199");
  const view = toChallengeOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeOverrideViews([item, item]).length, 2, "views");
});
