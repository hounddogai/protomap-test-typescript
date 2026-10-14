import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultCreditDigestEngine } from "./default-credit-digest-engine.js";
import { newDefaultCreditDigest } from "./default-credit-digest.js";

test("DefaultCreditDigestEngine keeps results within bounds", () => {
  const engine = defaultDefaultCreditDigestEngine(flags.newRegistry());
  const item = newDefaultCreditDigest("code-837", "label-513");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
