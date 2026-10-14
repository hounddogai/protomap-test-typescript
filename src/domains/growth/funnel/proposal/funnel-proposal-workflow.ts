import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FunnelProposalEngine, defaultFunnelProposalEngine } from "./funnel-proposal-engine.js";
import { FunnelProposalValidator, defaultFunnelProposalValidator } from "./funnel-proposal-rules.js";
import { FunnelProposalStore } from "./funnel-proposal-store.js";

/** Moves funnel proposals through their life cycle and keeps a journal of what it did. */
export class FunnelProposalCoordinator {
  store: FunnelProposalStore;
  validator: FunnelProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FunnelProposalEngine;

  constructor(
    store: FunnelProposalStore,
    validator: FunnelProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FunnelProposalEngine,
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
      throw new Error(`funnel proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`funnel proposal ${code} not found`);
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
      throw new Error(`funnel proposal ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFunnelProposalCoordinator(store: FunnelProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): FunnelProposalCoordinator {
  return new FunnelProposalCoordinator(
    store,
    defaultFunnelProposalValidator(),
    clockValue,
    [],
    defaultFunnelProposalEngine(flagsValue),
  );
}
