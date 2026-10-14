import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toLegacyEscalationExceptionView,
  toLegacyEscalationExceptionViews,
} from "./legacy-escalation-exception-view.js";
import { newLegacyEscalationException } from "./legacy-escalation-exception.js";

test("LegacyEscalationExceptionView shows the status in capitals", () => {
  const item = newLegacyEscalationException("code-597", "title-379");
  const view = toLegacyEscalationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyEscalationExceptionViews([item, item]).length, 2, "views");
});
