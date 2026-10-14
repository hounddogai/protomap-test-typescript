import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionCheckpointView, toDeflectionCheckpointViews } from "./deflection-checkpoint-view.js";
import { newDeflectionCheckpoint } from "./deflection-checkpoint.js";

test("DeflectionCheckpointView shows the status in capitals", () => {
  const item = newDeflectionCheckpoint("code-189", "name-343");
  const view = toDeflectionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionCheckpointViews([item, item]).length, 2, "views");
});
