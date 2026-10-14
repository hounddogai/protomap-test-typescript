import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredEscalationManifestView,
  toTieredEscalationManifestViews,
} from "./tiered-escalation-manifest-view.js";
import { newTieredEscalationManifest } from "./tiered-escalation-manifest.js";

test("TieredEscalationManifestView shows the status in capitals", () => {
  const item = newTieredEscalationManifest("code-966", "label-140");
  const view = toTieredEscalationManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredEscalationManifestViews([item, item]).length, 2, "views");
});
