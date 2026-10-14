import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyProofCycleView, toLegacyProofCycleViews } from "./legacy-proof-cycle-view.js";
import { newLegacyProofCycle } from "./legacy-proof-cycle.js";

test("LegacyProofCycleView shows the status in capitals", () => {
  const item = newLegacyProofCycle("code-884", "label-653");
  const view = toLegacyProofCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyProofCycleViews([item, item]).length, 2, "views");
});
