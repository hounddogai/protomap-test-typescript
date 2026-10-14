import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingEscalationExceptionView,
  toPendingEscalationExceptionViews,
} from "./pending-escalation-exception-view.js";
import { newPendingEscalationException } from "./pending-escalation-exception.js";

test("PendingEscalationExceptionView shows the status in capitals", () => {
  const item = newPendingEscalationException("code-248", "label-655");
  const view = toPendingEscalationExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingEscalationExceptionViews([item, item]).length, 2, "views");
});
