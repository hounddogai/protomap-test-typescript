import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InviteEstimateEngine, defaultInviteEstimateEngine } from "./invite-estimate-engine.js";
import { InviteEstimateValidator, defaultInviteEstimateValidator } from "./invite-estimate-rules.js";
import { InviteEstimateStore } from "./invite-estimate-store.js";

/** Moves invite estimates through their life cycle and keeps a journal of what it did. */
export class InviteEstimateCoordinator {
  store: InviteEstimateStore;
  validator: InviteEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteEstimateEngine;

  constructor(
    store: InviteEstimateStore,
    validator: InviteEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteEstimateEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite estimate ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newInviteEstimateCoordinator(store: InviteEstimateStore, clockValue: clock.Clock, flagsValue: flags.Registry): InviteEstimateCoordinator {
  return new InviteEstimateCoordinator(
    store,
    defaultInviteEstimateValidator(),
    clockValue,
    [],
    defaultInviteEstimateEngine(flagsValue),
  );
}
