import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingDomainDigestEngine } from "./pending-domain-digest-engine.js";
import { newPendingDomainDigest } from "./pending-domain-digest.js";

test("PendingDomainDigestEngine keeps results within bounds", () => {
  const engine = defaultPendingDomainDigestEngine(flags.newRegistry());
  const item = newPendingDomainDigest("code-216", "label-908");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
