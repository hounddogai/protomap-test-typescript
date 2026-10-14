import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledActivationDigestView,
  toScheduledActivationDigestViews,
} from "./scheduled-activation-digest-view.js";
import { newScheduledActivationDigest } from "./scheduled-activation-digest.js";

test("ScheduledActivationDigestView shows the status in capitals", () => {
  const item = newScheduledActivationDigest("code-634", "name-428");
  const view = toScheduledActivationDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledActivationDigestViews([item, item]).length, 2, "views");
});
