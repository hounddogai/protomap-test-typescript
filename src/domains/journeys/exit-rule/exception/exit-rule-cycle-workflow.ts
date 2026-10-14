import * as clock from "../../../../kit/clock.js";
import { ExitRuleCycleValidator, defaultExitRuleCycleValidator } from "./exit-rule-cycle-rules.js";
import { ExitRuleCycleStore } from "./exit-rule-cycle-store.js";

/** Moves exit rule cycles through their life cycle and keeps a journal of what it did. */
export class ExitRuleCycleDesk {
  store: ExitRuleCycleStore;
  validator: ExitRuleCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ExitRuleCycleStore,
    validator: ExitRuleCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newExitRuleCycleDesk(store: ExitRuleCycleStore, clockValue: clock.Clock): ExitRuleCycleDesk {
  return new ExitRuleCycleDesk(store, defaultExitRuleCycleValidator(), clockValue, []);
}
