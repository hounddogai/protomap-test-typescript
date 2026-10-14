import * as text from "../../../../kit/text.js";

/** Where a creative score is in its life cycle. */
export type CreativeScoreStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A creative score as the creative team keeps it. */
export class CreativeScore {
  code: string;
  name: string;
  region: string;
  currency: string;
  revision: number;
  frequencyCap: number;
  timezone: string;
  status: CreativeScoreStatus;

  constructor(
    code: string,
    name: string,
    region: string,
    currency: string,
    revision: number,
    frequencyCap: number,
    timezone: string,
    status: CreativeScoreStatus,
  ) {
    this.code = code;
    this.name = name;
    this.region = region;
    this.currency = currency;
    this.revision = revision;
    this.frequencyCap = frequencyCap;
    this.timezone = timezone;
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

  canMoveTo(next: CreativeScoreStatus): boolean {
    switch (this.status) {
      case "planned":
        return next === "completed";
      case "scheduled":
        switch (next) {
          case "completed":
          case "cancelled":
            return true;
        }
        return false;
      case "in_progress":
        return next === "completed" || next === "cancelled";
      case "completed":
        return next === "cancelled";
    }
    return false;
  }

  moveTo(next: CreativeScoreStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`creative score ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  projectedValue(): number {
    return Math.round(this.frequencyCap * this.revision * 100) / 100;
  }

  copy(): CreativeScore {
    return new CreativeScore(
      this.code,
      this.name,
      this.region,
      this.currency,
      this.revision,
      this.frequencyCap,
      this.timezone,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a creative score in status planned. */
export function newCreativeScore(code: string, name: string): CreativeScore {
  return new CreativeScore(code, name, "", "", 0, 0, "", "planned");
}
