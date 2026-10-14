import * as clock from "../../../../kit/clock.js";
import { PaywallCheckpointEngine, defaultPaywallCheckpointEngine } from "./paywall-checkpoint-engine.js";
import { PaywallCheckpointValidator, defaultPaywallCheckpointValidator } from "./paywall-checkpoint-rules.js";
import { PaywallCheckpointStore } from "./paywall-checkpoint-store.js";

/** Moves paywall checkpoints through their life cycle and keeps a journal of what it did. */
export class PaywallCheckpointManager {
  store: PaywallCheckpointStore;
  validator: PaywallCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PaywallCheckpointEngine;

  constructor(
    store: PaywallCheckpointStore,
    validator: PaywallCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PaywallCheckpointEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`paywall checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPaywallCheckpointManager(store: PaywallCheckpointStore, clockValue: clock.Clock): PaywallCheckpointManager {
  return new PaywallCheckpointManager(
    store,
    defaultPaywallCheckpointValidator(),
    clockValue,
    [],
    defaultPaywallCheckpointEngine(),
  );
}
