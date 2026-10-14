import assert from "node:assert/strict";
import { test } from "node:test";
import { toProofSlotView, toProofSlotViews } from "./proof-slot-view.js";
import { newProofSlot } from "./proof-slot.js";

test("ProofSlotView shows the status in capitals", () => {
  const item = newProofSlot("code-373", "title-715");
  const view = toProofSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toProofSlotViews([item, item]).length, 2, "views");
});
