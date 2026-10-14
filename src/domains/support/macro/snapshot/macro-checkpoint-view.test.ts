import assert from "node:assert/strict";
import { test } from "node:test";
import { toMacroCheckpointView, toMacroCheckpointViews } from "./macro-checkpoint-view.js";
import { newMacroCheckpoint } from "./macro-checkpoint.js";

test("MacroCheckpointView shows the status in capitals", () => {
  const item = newMacroCheckpoint("code-117", "label-268");
  const view = toMacroCheckpointView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMacroCheckpointViews([item, item]).length, 2, "views");
});
