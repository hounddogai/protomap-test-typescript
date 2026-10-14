import assert from "node:assert/strict";
import { test } from "node:test";
import * as collections from "./collections.js";

test("Collections chunks into batches", () => {
  const items = [1, 2, 3, 4, 5, 6, 7];
  const chunks = collections.chunk(items, 3);
  assert.equal(chunks.length, 3, "chunks");
  assert.equal(chunks[2]!.length, 1, "last chunk");
});

test("Collections filters and counts", () => {
  const items = [4, 9, 15, 16, 23, 42];
  const even = collections.filter(items, (n: number): boolean => n % 2 === 0);
  assert.equal(even.length, 3, "even");
  const counts = collections.countBy(
    items,
    (n: number): string => {
      if (n > 10) return "big";
      return "small";
    },
  );
  assert.equal(counts.get("big") ?? 0, 4, "big");
});

test("Collections drops repeated strings", () => {
  assert.equal(collections.uniqueStrings(["a", "b", "a"]).length, 2, "unique");
});
