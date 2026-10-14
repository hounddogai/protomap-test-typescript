import * as text from "../../../../kit/text.js";

/** Where a approval rule is in its life cycle. */
export type ApprovalRuleStatus = "requested" | "granted" | "revoked" | "expired";

/** A approval rule. Its code is unique within a tenant. */
export class ApprovalRule {
  code: string;
  title: string;
  revision: number;
  durationMinutes: number;
  ratio: number;
  capacity: number;
  status: ApprovalRuleStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    durationMinutes: number,
    ratio: number,
    capacity: number,
    status: ApprovalRuleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.durationMinutes = durationMinutes;
    this.ratio = ratio;
    this.capacity = capacity;
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

  canMoveTo(next: ApprovalRuleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalRuleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval rule ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  effectiveValue(): number {
    return Math.round((this.revision + this.ratio) * 100) / 100;
  }

  copy(): ApprovalRule {
    return new ApprovalRule(
      this.code,
      this.title,
      this.revision,
      this.durationMinutes,
      this.ratio,
      this.capacity,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a approval rule in status requested. */
export function newApprovalRule(code: string, title: string): ApprovalRule {
  return new ApprovalRule(code, title, 0, 0, 0, 0, "requested");
}
