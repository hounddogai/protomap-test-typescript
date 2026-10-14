import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictTicketViewManifestView,
  toStrictTicketViewManifestViews,
} from "./strict-ticket-view-manifest-view.js";
import { newStrictTicketViewManifest } from "./strict-ticket-view-manifest.js";

test("StrictTicketViewManifestView shows the status in capitals", () => {
  const item = newStrictTicketViewManifest("code-301", "title-193");
  const view = toStrictTicketViewManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictTicketViewManifestViews([item, item]).length, 2, "views");
});
