import assert from "node:assert/strict";
import { test } from "node:test";
import { toEscalationCheckpointView, toEscalationCheckpointViews } from "./escalation-checkpoint-view.js";
import { newEscalationCheckpoint } from "./escalation-checkpoint.js";

test("EscalationCheckpointView shows the status in capitals", () => {
  const item = newEscalationCheckpoint("code-595", "label-679");
  const view = toEscalationCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEscalationCheckpointViews([item, item]).length, 2, "views");
});
