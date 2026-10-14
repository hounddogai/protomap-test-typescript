import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictRewardRuleManifestView,
  toStrictRewardRuleManifestViews,
} from "./strict-reward-rule-manifest-view.js";
import { newStrictRewardRuleManifest } from "./strict-reward-rule-manifest.js";

test("StrictRewardRuleManifestView shows the status in capitals", () => {
  const item = newStrictRewardRuleManifest("code-950", "label-223");
  const view = toStrictRewardRuleManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictRewardRuleManifestViews([item, item]).length, 2, "views");
});
