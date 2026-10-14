import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toWeightedDoubleOptInDigestView,
  toWeightedDoubleOptInDigestViews,
} from "./weighted-double-opt-in-digest-view.js";
import { newWeightedDoubleOptInDigest } from "./weighted-double-opt-in-digest.js";

test("WeightedDoubleOptInDigestView shows the status in capitals", () => {
  const item = newWeightedDoubleOptInDigest("code-586", "name-412");
  const view = toWeightedDoubleOptInDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWeightedDoubleOptInDigestViews([item, item]).length, 2, "views");
});
