import assert from "node:assert/strict";
import { test } from "node:test";
import { toStreakDigestView, toStreakDigestViews } from "./streak-digest-view.js";
import { newStreakDigest } from "./streak-digest.js";

test("StreakDigestView shows the status in capitals", () => {
  const item = newStreakDigest("code-427", "label-285");
  const view = toStreakDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStreakDigestViews([item, item]).length, 2, "views");
});
