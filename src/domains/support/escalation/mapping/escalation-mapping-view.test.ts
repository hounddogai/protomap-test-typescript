import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationMappingView, toEscalationMappingViews } from "./escalation-mapping-view.js";
import { newEscalationMapping } from "./escalation-mapping.js";

test("EscalationMappingView shows the status in capitals", () => {
  const item = newEscalationMapping("code-581", "title-143");
  const view = toEscalationMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationMappingViews([item, item]).length, 2, "views");
});
