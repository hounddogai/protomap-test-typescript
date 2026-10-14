import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainDigestEngine } from "./domain-digest-engine.js";
import { newDomainDigest } from "./domain-digest.js";

test("DomainDigestEngine keeps results within bounds", () => {
  const engine = defaultDomainDigestEngine(flags.newRegistry());
  const item = newDomainDigest("code-725", "name-154");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
