import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedActivationDigestView,
  toWeightedActivationDigestViews,
} from "./weighted-activation-digest-view.js";
import { newWeightedActivationDigest } from "./weighted-activation-digest.js";

test("WeightedActivationDigestView shows the status in capitals", () => {
  const item = newWeightedActivationDigest("code-575", "label-98");
  const view = toWeightedActivationDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedActivationDigestViews([item, item]).length, 2, "views");
});
