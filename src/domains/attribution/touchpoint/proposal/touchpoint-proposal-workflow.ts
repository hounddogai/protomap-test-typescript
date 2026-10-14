import * as clock from "../../../../kit/clock.js";
import { TouchpointProposalEngine, defaultTouchpointProposalEngine } from "./touchpoint-proposal-engine.js";
import { TouchpointProposalValidator, defaultTouchpointProposalValidator } from "./touchpoint-proposal-rules.js";
import { TouchpointProposalStore } from "./touchpoint-proposal-store.js";

/** Moves touchpoint proposals through their life cycle and keeps a journal of what it did. */
export class TouchpointProposalCoordinator {
  store: TouchpointProposalStore;
  validator: TouchpointProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointProposalEngine;

  constructor(
    store: TouchpointProposalStore,
    validator: TouchpointProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointProposalEngine,
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
      throw new Error(`touchpoint proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint proposal ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTouchpointProposalCoordinator(store: TouchpointProposalStore, clockValue: clock.Clock): TouchpointProposalCoordinator {
  return new TouchpointProposalCoordinator(
    store,
    defaultTouchpointProposalValidator(),
    clockValue,
    [],
    defaultTouchpointProposalEngine(),
  );
}
