import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingEscalationMappingView,
  toRollingEscalationMappingViews,
} from "./rolling-escalation-mapping-view.js";
import { newRollingEscalationMapping } from "./rolling-escalation-mapping.js";

test("RollingEscalationMappingView shows the status in capitals", () => {
  const item = newRollingEscalationMapping("code-184", "label-643");
  const view = toRollingEscalationMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingEscalationMappingViews([item, item]).length, 2, "views");
});
