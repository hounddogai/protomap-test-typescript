import assert from "node:assert/strict";
import { test } from "node:test";
import { toRewardManifestView, toRewardManifestViews } from "./reward-manifest-view.js";
import { newRewardManifest } from "./reward-manifest.js";

test("RewardManifestView shows the status in capitals", () => {
  const item = newRewardManifest("code-260", "title-214");
  const view = toRewardManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRewardManifestViews([item, item]).length, 2, "views");
});
