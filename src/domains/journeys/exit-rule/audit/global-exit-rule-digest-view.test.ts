import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalExitRuleDigestView, toGlobalExitRuleDigestViews } from "./global-exit-rule-digest-view.js";
import { newGlobalExitRuleDigest } from "./global-exit-rule-digest.js";

test("GlobalExitRuleDigestView shows the status in capitals", () => {
  const item = newGlobalExitRuleDigest("code-198", "label-463");
  const view = toGlobalExitRuleDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalExitRuleDigestViews([item, item]).length, 2, "views");
});
