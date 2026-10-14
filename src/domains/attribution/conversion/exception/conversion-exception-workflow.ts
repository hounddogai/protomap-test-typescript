import * as clock from "../../../../kit/clock.js";
import { ConversionExceptionValidator, defaultConversionExceptionValidator } from "./conversion-exception-rules.js";
import { ConversionExceptionStore } from "./conversion-exception-store.js";

/** Moves conversion exceptions through their life cycle and keeps a journal of what it did. */
export class ConversionExceptionWorkflow {
  store: ConversionExceptionStore;
  validator: ConversionExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ConversionExceptionStore,
    validator: ConversionExceptionValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newConversionExceptionWorkflow(store: ConversionExceptionStore, clockValue: clock.Clock): ConversionExceptionWorkflow {
  return new ConversionExceptionWorkflow(store, defaultConversionExceptionValidator(), clockValue, []);
}
