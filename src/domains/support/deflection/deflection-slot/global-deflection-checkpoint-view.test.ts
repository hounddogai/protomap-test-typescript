import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toGlobalDeflectionCheckpointView,
  toGlobalDeflectionCheckpointViews,
} from "./global-deflection-checkpoint-view.js";
import { newGlobalDeflectionCheckpoint } from "./global-deflection-checkpoint.js";

test("GlobalDeflectionCheckpointView shows the status in capitals", () => {
  const item = newGlobalDeflectionCheckpoint("code-201", "label-413");
  const view = toGlobalDeflectionCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalDeflectionCheckpointViews([item, item]).length, 2, "views");
});
