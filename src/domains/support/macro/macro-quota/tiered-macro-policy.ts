import * as text from "../../../../kit/text.js";

/** Where a tiered macro policy is in its life cycle. */
export type TieredMacroPolicyStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A tiered macro policy. Its code is unique within a tenant. */
export class TieredMacroPolicy {
  code: string;
  name: string;
  utmSource: string;
  revision: number;
  sendAt: number;
  createdAt: number;
  budget: number;
  rate: number;
  status: TieredMacroPolicyStatus;

  constructor(
    code: string,
    name: string,
    utmSource: string,
    revision: number,
    sendAt: number,
    createdAt: number,
    budget: number,
    rate: number,
    status: TieredMacroPolicyStatus,
  ) {
    this.code = code;
    this.name = name;
    this.utmSource = utmSource;
    this.revision = revision;
    this.sendAt = sendAt;
    this.createdAt = createdAt;
    this.budget = budget;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: TieredMacroPolicyStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "scheduled" || next === "in_progress";
      case "scheduled":
        return next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: TieredMacroPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered macro policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedExposure(): number {
    return Math.round(this.revision * this.createdAt * 100) / 100;
  }

  copy(): TieredMacroPolicy {
    return new TieredMacroPolicy(
      this.code,
      this.name,
      this.utmSource,
      this.revision,
      this.sendAt,
      this.createdAt,
      this.budget,
      this.rate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a tiered macro policy in status planned. */
export function newTieredMacroPolicy(code: string, name: string): TieredMacroPolicy {
  return new TieredMacroPolicy(code, name, "", 0, 0, 0, 0, 0, "planned");
}
