import assert from "node:assert/strict";
import { test } from "node:test";
import * as numbers from "./numbers.js";

test("Numbers clamps into range", () => {
  assert.equal(numbers.clamp(12, 0, 10), 10, "high");
  assert.equal(numbers.clamp(-3, 0, 10), 0, "low");
  assert.equal(numbers.percent(1, 4), 25, "percent");
});

test("Numbers finds the median by rank", () => {
  assert.equal(numbers.percentile([5, 1, 3], 50), 3, "median");
  assert.equal(numbers.mean([]), 0, "empty mean");
  assert.throws(() => numbers.weightedMean([1], []), Error, "mismatched weights");
});
