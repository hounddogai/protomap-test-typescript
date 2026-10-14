import * as text from "../../../../kit/text.js";

/** Where a exit rule forecast is in its life cycle. */
export type ExitRuleForecastStatus = "proposed" | "approved" | "rejected" | "withdrawn";

/** A exit rule forecast as the exit rule team keeps it. */
export class ExitRuleForecast {
  code: string;
  name: string;
  archived: boolean;
  ownerId: string;
  revision: number;
  status: ExitRuleForecastStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    ownerId: string,
    revision: number,
    status: ExitRuleForecastStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.ownerId = ownerId;
    this.revision = revision;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "withdrawn":
        return true;
    }
    return false;
  }

  canMoveTo(next: ExitRuleForecastStatus): boolean {
    switch (this.status) {
      case "proposed":
        return next === "rejected";
      case "approved":
        switch (next) {
          case "rejected":
            return true;
        }
        return false;
      case "rejected":
        switch (next) {
          case "withdrawn":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ExitRuleForecastStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`exit rule forecast ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} (${this.name})`;
  }

  measuredValue(): number {
    return this.revision;
  }

  copy(): ExitRuleForecast {
    return new ExitRuleForecast(this.code, this.name, this.archived, this.ownerId, this.revision, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a exit rule forecast in status proposed. */
export function newExitRuleForecast(code: string, name: string): ExitRuleForecast {
  return new ExitRuleForecast(code, name, false, "", 0, "proposed");
}
