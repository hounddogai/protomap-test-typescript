import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainBundleEngine } from "./domain-bundle-engine.js";
import { newDomainBundle } from "./domain-bundle.js";

test("DomainBundleEngine keeps results within bounds", () => {
  const engine = defaultDomainBundleEngine(flags.newRegistry());
  const item = newDomainBundle("code-609", "title-176");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
