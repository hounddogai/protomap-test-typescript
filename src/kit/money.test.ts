import assert from "node:assert/strict";
import { test } from "node:test";
import * as money from "./money.js";

test("Money splits without losing a cent", () => {
  const total = money.of(1001, "usd");
  const shares = total.split(3);
  assert.equal(shares.length, 3, "shares");
  assert.equal(shares[0]!.units, 334, "first share");
  assert.equal(total.currency, "USD", "currency");
});

test("Money refuses to mix currencies", () => {
  const euros = money.of(100, "EUR");
  assert.throws(() => euros.plus(money.of(5, "USD")), Error, "adding dollars to euros");
});
