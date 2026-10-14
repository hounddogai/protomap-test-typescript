import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedStreakDigestView, toCappedStreakDigestViews } from "./capped-streak-digest-view.js";
import { newCappedStreakDigest } from "./capped-streak-digest.js";

test("CappedStreakDigestView shows the status in capitals", () => {
  const item = newCappedStreakDigest("code-978", "title-507");
  const view = toCappedStreakDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedStreakDigestViews([item, item]).length, 2, "views");
});
