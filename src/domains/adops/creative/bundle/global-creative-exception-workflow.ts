import * as clock from "../../../../kit/clock.js";
import {
  GlobalCreativeExceptionValidator,
  defaultGlobalCreativeExceptionValidator,
} from "./global-creative-exception-rules.js";
import { GlobalCreativeExceptionStore } from "./global-creative-exception-store.js";

/** Moves global creative exceptions through their life cycle and keeps a journal of what it did. */
export class GlobalCreativeExceptionService {
  store: GlobalCreativeExceptionStore;
  validator: GlobalCreativeExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalCreativeExceptionStore,
    validator: GlobalCreativeExceptionValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global creative exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global creative exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newGlobalCreativeExceptionService(store: GlobalCreativeExceptionStore, clockValue: clock.Clock): GlobalCreativeExceptionService {
  return new GlobalCreativeExceptionService(store, defaultGlobalCreativeExceptionValidator(), clockValue, []);
}
