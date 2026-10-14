import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeTierView, toChallengeTierViews } from "./challenge-tier-view.js";
import { newChallengeTier } from "./challenge-tier.js";

test("ChallengeTierView shows the status in capitals", () => {
  const item = newChallengeTier("code-976", "label-897");
  const view = toChallengeTierView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeTierViews([item, item]).length, 2, "views");
});
