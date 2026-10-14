import assert from "node:assert/strict";
import { test } from "node:test";
import { toInviteManifestView, toInviteManifestViews } from "./invite-manifest-view.js";
import { newInviteManifest } from "./invite-manifest.js";

test("InviteManifestView shows the status in capitals", () => {
  const item = newInviteManifest("code-148", "name-878");
  const view = toInviteManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toInviteManifestViews([item, item]).length, 2, "views");
});
