import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalReplyAgreementEngine } from "./regional-reply-agreement-engine.js";
import { newRegionalReplyAgreement } from "./regional-reply-agreement.js";

test("RegionalReplyAgreementEngine keeps results within bounds", () => {
  const engine = defaultRegionalReplyAgreementEngine(flags.newRegistry());
  const item = newRegionalReplyAgreement("code-238", "title-769");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
