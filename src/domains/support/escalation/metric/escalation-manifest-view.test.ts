import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationManifestView, toEscalationManifestViews } from "./escalation-manifest-view.js";
import { newEscalationManifest } from "./escalation-manifest.js";

test("EscalationManifestView shows the status in capitals", () => {
  const item = newEscalationManifest("code-340", "name-735");
  const view = toEscalationManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationManifestViews([item, item]).length, 2, "views");
});
