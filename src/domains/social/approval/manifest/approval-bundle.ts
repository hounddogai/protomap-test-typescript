import * as text from "../../../../kit/text.js";

/** Where a approval bundle is in its life cycle. */
export type ApprovalBundleStatus = "requested" | "granted" | "revoked" | "expired";

/** One approval bundle, with what the planners need to act on it. */
export class ApprovalBundle {
  code: string;
  title: string;
  updatedAt: number;
  category: string;
  variant: string;
  retries: number;
  maximum: number;
  status: ApprovalBundleStatus;

  constructor(
    code: string,
    title: string,
    updatedAt: number,
    category: string,
    variant: string,
    retries: number,
    maximum: number,
    status: ApprovalBundleStatus,
  ) {
    this.code = code;
    this.title = title;
    this.updatedAt = updatedAt;
    this.category = category;
    this.variant = variant;
    this.retries = retries;
    this.maximum = maximum;
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

  canMoveTo(next: ApprovalBundleStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ApprovalBundleStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`approval bundle ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.updatedAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  projectedLoad(): number {
    return Math.round((this.retries + this.updatedAt) * 100) / 100;
  }

  copy(): ApprovalBundle {
    return new ApprovalBundle(
      this.code,
      this.title,
      this.updatedAt,
      this.category,
      this.variant,
      this.retries,
      this.maximum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a approval bundle in status requested. */
export function newApprovalBundle(code: string, title: string): ApprovalBundle {
  return new ApprovalBundle(code, title, 0, "", "", 0, 0, "requested");
}
