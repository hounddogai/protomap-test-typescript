import assert from "node:assert/strict";
import { test } from "node:test";
import * as text from "./text.js";

test("Text normalizes case and space", () => {
  assert.equal(text.normalize("  Mixed Case "), "mixed case", "normalizes case and space");
});

test("Text slugifies names", () => {
  assert.equal(text.slugify(" Spring  Sale 2026 "), "spring-sale-2026", "slugifies names");
});

test("Text truncates long values", () => {
  assert.equal(text.truncate("abcdefghij", 6), "abc...", "truncates long values");
});

test("Text keeps short values", () => {
  assert.equal(text.truncate("abc", 6), "abc", "keeps short values");
});

test("Text masks all but the tail", () => {
  assert.equal(text.maskTail("4111111111111111", 4), "************1111", "masks all but the tail");
});

test("Text counts words", () => {
  assert.equal(text.wordCount("  one two  three "), 3, "counts words");
});

test("Text fits to a width", () => {
  assert.equal(text.fit("ab", 4), "ab  ", "fits to a width");
});

test("Text joins only non empty parts", () => {
  assert.equal(text.joinNonEmpty(["a", " ", "b"], "/"), "a/b", "joined");
  assert.ok(text.containsAny("Late Fee", ["fee"]), "contains fee");
});
