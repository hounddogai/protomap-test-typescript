import * as clock from "../../../../kit/clock.js";
import { PrimaryLevelWindowValidator, defaultPrimaryLevelWindowValidator } from "./primary-level-window-rules.js";
import { PrimaryLevelWindowStore } from "./primary-level-window-store.js";

/** Moves primary level windows through their life cycle and keeps a journal of what it did. */
export class PrimaryLevelWindowWorkflow {
  store: PrimaryLevelWindowStore;
  validator: PrimaryLevelWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryLevelWindowStore,
    validator: PrimaryLevelWindowValidator,
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
      throw new Error(`primary level window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary level window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newPrimaryLevelWindowWorkflow(store: PrimaryLevelWindowStore, clockValue: clock.Clock): PrimaryLevelWindowWorkflow {
  return new PrimaryLevelWindowWorkflow(store, defaultPrimaryLevelWindowValidator(), clockValue, []);
}
