import * as text from "../../../../kit/text.js";

/** Where a legacy double opt in rollup is in its life cycle. */
export type LegacyDoubleOptInRollupStatus = "created" | "validated" | "published" | "retired";

/** The record of a legacy double opt in rollup and its current status. */
export class LegacyDoubleOptInRollup {
  code: string;
  name: string;
  phone: string;
  channel: string;
  variant: string;
  amount: number;
  status: LegacyDoubleOptInRollupStatus;

  constructor(
    code: string,
    name: string,
    phone: string,
    channel: string,
    variant: string,
    amount: number,
    status: LegacyDoubleOptInRollupStatus,
  ) {
    this.code = code;
    this.name = name;
    this.phone = phone;
    this.channel = channel;
    this.variant = variant;
    this.amount = amount;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyDoubleOptInRollupStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "published":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LegacyDoubleOptInRollupStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy double opt in rollup ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"legacy double opt in rollup"} ${this.code}`;
  }

  measuredValue(): number {
    return this.amount;
  }

  copy(): LegacyDoubleOptInRollup {
    return new LegacyDoubleOptInRollup(
      this.code,
      this.name,
      this.phone,
      this.channel,
      this.variant,
      this.amount,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a legacy double opt in rollup in status created. */
export function newLegacyDoubleOptInRollup(code: string, name: string): LegacyDoubleOptInRollup {
  return new LegacyDoubleOptInRollup(code, name, "", "", "", 0, "created");
}
