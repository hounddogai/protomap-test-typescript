import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPrimaryRewardRuleManifestView,
  toPrimaryRewardRuleManifestViews,
} from "./primary-reward-rule-manifest-view.js";
import { newPrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

test("PrimaryRewardRuleManifestView shows the status in capitals", () => {
  const item = newPrimaryRewardRuleManifest("code-196", "name-732");
  const view = toPrimaryRewardRuleManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryRewardRuleManifestViews([item, item]).length, 2, "views");
});
