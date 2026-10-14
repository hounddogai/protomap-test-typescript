import * as text from "../../../../kit/text.js";

/** Where a model audit is in its life cycle. */
export type ModelAuditStatus = "created" | "validated" | "published" | "retired";

/** The record of a model audit and its current status. */
export class ModelAudit {
  code: string;
  name: string;
  sequence: number;
  audienceId: string;
  priority: number;
  locale: string;
  clicks: number;
  cost: number;
  impressions: number;
  status: ModelAuditStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    audienceId: string,
    priority: number,
    locale: string,
    clicks: number,
    cost: number,
    impressions: number,
    status: ModelAuditStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.audienceId = audienceId;
    this.priority = priority;
    this.locale = locale;
    this.clicks = clicks;
    this.cost = cost;
    this.impressions = impressions;
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

  canMoveTo(next: ModelAuditStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "published":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: ModelAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`model audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"model audit"} ${this.code}`;
  }

  adjustedExposure(): number {
    return Math.round(this.cost * this.sequence * 100) / 100;
  }

  copy(): ModelAudit {
    return new ModelAudit(
      this.code,
      this.name,
      this.sequence,
      this.audienceId,
      this.priority,
      this.locale,
      this.clicks,
      this.cost,
      this.impressions,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a model audit in status created. */
export function newModelAudit(code: string, name: string): ModelAudit {
  return new ModelAudit(code, name, 0, "", 0, "", 0, 0, 0, "created");
}
