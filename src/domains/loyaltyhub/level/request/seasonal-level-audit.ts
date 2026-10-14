import * as text from "../../../../kit/text.js";

/** Where a seasonal level audit is in its life cycle. */
export type SeasonalLevelAuditStatus = "created" | "validated" | "published" | "retired";

/** A seasonal level audit as the level team keeps it. */
export class SeasonalLevelAudit {
  code: string;
  name: string;
  archived: boolean;
  externalRef: string;
  journeyId: string;
  score: number;
  status: SeasonalLevelAuditStatus;

  constructor(
    code: string,
    name: string,
    archived: boolean,
    externalRef: string,
    journeyId: string,
    score: number,
    status: SeasonalLevelAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.archived = archived;
    this.externalRef = externalRef;
    this.journeyId = journeyId;
    this.score = score;
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

  canMoveTo(next: SeasonalLevelAuditStatus): boolean {
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

  moveTo(next: SeasonalLevelAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`seasonal level audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} [${this.name}]`;
  }

  measuredValue(): number {
    return this.score;
  }

  copy(): SeasonalLevelAudit {
    return new SeasonalLevelAudit(
      this.code,
      this.name,
      this.archived,
      this.externalRef,
      this.journeyId,
      this.score,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a seasonal level audit in status created. */
export function newSeasonalLevelAudit(code: string, name: string): SeasonalLevelAudit {
  return new SeasonalLevelAudit(code, name, false, "", "", 0, "created");
}
