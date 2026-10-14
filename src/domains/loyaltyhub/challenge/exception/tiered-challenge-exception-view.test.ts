import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toTieredChallengeExceptionView,
  toTieredChallengeExceptionViews,
} from "./tiered-challenge-exception-view.js";
import { newTieredChallengeException } from "./tiered-challenge-exception.js";

test("TieredChallengeExceptionView shows the status in capitals", () => {
  const item = newTieredChallengeException("code-955", "title-339");
  const view = toTieredChallengeExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredChallengeExceptionViews([item, item]).length, 2, "views");
});
