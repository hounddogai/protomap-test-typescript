import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofCycleView, toProofCycleViews } from "./proof-cycle-view.js";
import { newProofCycle } from "./proof-cycle.js";

test("ProofCycleView shows the status in capitals", () => {
  const item = newProofCycle("code-430", "title-130");
  const view = toProofCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofCycleViews([item, item]).length, 2, "views");
});
