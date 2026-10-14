import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryActivationDigestView, toPrimaryActivationDigestViews } from "./primary-activation-digest-view.js";
import { newPrimaryActivationDigest } from "./primary-activation-digest.js";

test("PrimaryActivationDigestView shows the status in capitals", () => {
  const item = newPrimaryActivationDigest("code-3", "title-989");
  const view = toPrimaryActivationDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryActivationDigestViews([item, item]).length, 2, "views");
});
