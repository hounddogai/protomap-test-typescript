import * as clock from "../../../../kit/clock.js";
import {
  DefaultPacingAgreementEngine,
  defaultDefaultPacingAgreementEngine,
} from "./default-pacing-agreement-engine.js";
import {
  DefaultPacingAgreementValidator,
  defaultDefaultPacingAgreementValidator,
} from "./default-pacing-agreement-rules.js";
import { DefaultPacingAgreementStore } from "./default-pacing-agreement-store.js";

/** Moves default pacing agreements through their life cycle and keeps a journal of what it did. */
export class DefaultPacingAgreementWorkflow {
  store: DefaultPacingAgreementStore;
  validator: DefaultPacingAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultPacingAgreementEngine;

  constructor(
    store: DefaultPacingAgreementStore,
    validator: DefaultPacingAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultPacingAgreementEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default pacing agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default pacing agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default pacing agreement ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultPacingAgreementWorkflow(store: DefaultPacingAgreementStore, clockValue: clock.Clock): DefaultPacingAgreementWorkflow {
  return new DefaultPacingAgreementWorkflow(
    store,
    defaultDefaultPacingAgreementValidator(),
    clockValue,
    [],
    defaultDefaultPacingAgreementEngine(),
  );
}
