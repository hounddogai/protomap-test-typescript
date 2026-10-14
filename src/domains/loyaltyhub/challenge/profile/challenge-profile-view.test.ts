import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeProfileView, toChallengeProfileViews } from "./challenge-profile-view.js";
import { newChallengeProfile } from "./challenge-profile.js";

test("ChallengeProfileView shows the status in capitals", () => {
  const item = newChallengeProfile("code-570", "title-52");
  const view = toChallengeProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeProfileViews([item, item]).length, 2, "views");
});
