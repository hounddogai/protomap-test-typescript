import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationDigestView, toEscalationDigestViews } from "./escalation-digest-view.js";
import { newEscalationDigest } from "./escalation-digest.js";

test("EscalationDigestView shows the status in capitals", () => {
  const item = newEscalationDigest("code-969", "label-760");
  const view = toEscalationDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationDigestViews([item, item]).length, 2, "views");
});
