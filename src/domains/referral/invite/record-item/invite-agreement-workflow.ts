import * as clock from "../../../../kit/clock.js";
import { InviteAgreementEngine, defaultInviteAgreementEngine } from "./invite-agreement-engine.js";
import { InviteAgreementValidator, defaultInviteAgreementValidator } from "./invite-agreement-rules.js";
import { InviteAgreementStore } from "./invite-agreement-store.js";

/** Moves invite agreements through their life cycle and keeps a journal of what it did. */
export class InviteAgreementService {
  store: InviteAgreementStore;
  validator: InviteAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteAgreementEngine;

  constructor(
    store: InviteAgreementStore,
    validator: InviteAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteAgreementEngine,
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
      throw new Error(`invite agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite agreement ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newInviteAgreementService(store: InviteAgreementStore, clockValue: clock.Clock): InviteAgreementService {
  return new InviteAgreementService(
    store,
    defaultInviteAgreementValidator(),
    clockValue,
    [],
    defaultInviteAgreementEngine(),
  );
}
