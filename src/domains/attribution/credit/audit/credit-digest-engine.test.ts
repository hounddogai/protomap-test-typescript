import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditDigestEngine } from "./credit-digest-engine.js";
import { newCreditDigest } from "./credit-digest.js";

test("CreditDigestEngine keeps results within bounds", () => {
  const engine = defaultCreditDigestEngine(flags.newRegistry());
  const item = newCreditDigest("code-916", "name-457");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
