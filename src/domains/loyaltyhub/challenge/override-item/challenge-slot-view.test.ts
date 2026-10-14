import assert from "node:assert/strict";
import { test } from "node:test";
import { toChallengeSlotView, toChallengeSlotViews } from "./challenge-slot-view.js";
import { newChallengeSlot } from "./challenge-slot.js";

test("ChallengeSlotView shows the status in capitals", () => {
  const item = newChallengeSlot("code-296", "name-137");
  const view = toChallengeSlotView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toChallengeSlotViews([item, item]).length, 2, "views");
});
