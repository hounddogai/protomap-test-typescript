import * as text from "../../../../kit/text.js";

/** Where a global suppression audit is in its life cycle. */
export type GlobalSuppressionAuditStatus = "requested" | "granted" | "revoked" | "expired";

/** A global suppression audit as the suppression team keeps it. */
export class GlobalSuppressionAudit {
  code: string;
  title: string;
  archived: boolean;
  retries: number;
  rate: number;
  status: GlobalSuppressionAuditStatus;

  constructor(
    code: string,
    title: string,
    archived: boolean,
    retries: number,
    rate: number,
    status: GlobalSuppressionAuditStatus,
  ) {
    this.code = code;
    this.title = title;
    this.archived = archived;
    this.retries = retries;
    this.rate = rate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: GlobalSuppressionAuditStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: GlobalSuppressionAuditStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`global suppression audit ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  weightedLoad(): number {
    return Math.round((this.retries + this.rate) * 100) / 100;
  }

  copy(): GlobalSuppressionAudit {
    return new GlobalSuppressionAudit(this.code, this.title, this.archived, this.retries, this.rate, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a global suppression audit in status requested. */
export function newGlobalSuppressionAudit(code: string, title: string): GlobalSuppressionAudit {
  return new GlobalSuppressionAudit(code, title, false, 0, 0, "requested");
}
